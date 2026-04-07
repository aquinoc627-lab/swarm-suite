from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import pyotp
import qrcode
from io import BytesIO
import base64

from app.core.audit import record_audit
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_password,
    hash_token,
    require_admin,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.schemas import (
    LoginRequest,
    TokenPair,
    UserCreate,
    UserRead,
    VerifyTOTP,
    VerifyLoginTOTP,
    TOTPSetupResponse
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user."""
    existing = await db.execute(
        select(User).where((User.username == body.username) | (User.email == body.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username or email already exists")

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=hash_password(body.password),
        role="operator",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login")
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate with username and password. Returns TokenPair or requires 2FA."""
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        await record_audit(db, user_id=None, action="login_failed", entity_type="auth", details={"username": body.username}, request=request)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    if user.totp_enabled:
        return {"require2fa": True, "message": "2FA required. Call /verify-login-2fa"}

    # Generate token pair
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    hashed_rt = hash_token(refresh_token)
    from datetime import datetime, timedelta, timezone
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    db.add(RefreshToken(user_id=user.id, token_hash=hashed_rt, expires_at=expires_at))

    await record_audit(db, user_id=user.id, action="login_success", entity_type="auth", request=request)
    await db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/verify-login-2fa")
async def verify_login_2fa(
    body: VerifyLoginTOTP,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.totp_enabled or not user.totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA not enabled")

    totp = pyotp.TOTP(user.totp_secret)
    if not totp.verify(body.otp_code, valid_window=1):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid 2FA code")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    hashed_rt = hash_token(refresh_token)
    from datetime import datetime, timedelta, timezone
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    db.add(RefreshToken(user_id=user.id, token_hash=hashed_rt, expires_at=expires_at))

    await record_audit(db, user_id=user.id, action="login_success_2fa", entity_type="auth", request=request)
    await db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/enable-2fa", response_model=TOTPSetupResponse)
async def enable_2fa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
        
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=current_user.email, issuer_name="AutonomousNexus")
    
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    current_user.totp_secret = secret
    db.add(current_user)
    await db.commit()
    
    return TOTPSetupResponse(qr_code=f"data:image/png;base64,{img_base64}", secret=secret)

@router.post("/confirm-2fa")
async def confirm_2fa(
    body: VerifyTOTP,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.totp_enabled:
        raise HTTPException(status_code=400, detail="2FA is already active")
    if not current_user.totp_secret:
        raise HTTPException(status_code=400, detail="Please initiate 2FA setup first")

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(body.otp_code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    current_user.totp_enabled = True
    db.add(current_user)
    await record_audit(db, user_id=current_user.id, action="enabled_2fa", entity_type="auth", ip_address="0.0.0.0")
    await db.commit()

    return {"status": "success", "message": "Two-Factor Authentication enabled"}

@router.get("/me", response_model=UserRead)
async def me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/refresh")
async def refresh_token(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing refresh token")
        
    token_hash = hash_token(token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash, RefreshToken.revoked == False)
    )
    stored = result.scalar_one_or_none()
    
    if not stored:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    stored.revoked = True
    
    user_result = await db.execute(select(User).where(User.id == stored.user_id))
    user = user_result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive")
        
    access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh = create_refresh_token(data={"sub": str(user.id)})
    
    new_hash = hash_token(new_refresh)
    from datetime import datetime, timedelta, timezone
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    db.add(RefreshToken(user_id=user.id, token_hash=new_hash, expires_at=expires_at))
    await db.commit()
    
    return {"access_token": access_token, "refresh_token": new_refresh, "token_type": "bearer"}

@router.post("/logout")
async def logout(
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = body.get("refresh_token")
    if token:
        token_hash = hash_token(token)
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash, RefreshToken.user_id == current_user.id)
        )
        stored = result.scalar_one_or_none()
        if stored:
            stored.revoked = True
            await db.commit()
    return {"status": "ok"}
