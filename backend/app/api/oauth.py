import urllib.parse

import httpx
from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from ..core.config import settings
from ..core.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

_PROVIDERS = {
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v3/userinfo",
        "scope": "openid email profile",
        "client_id_key": "GOOGLE_CLIENT_ID",
        "client_secret_key": "GOOGLE_CLIENT_SECRET",
    },
    "github": {
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "userinfo_url": "https://api.github.com/user",
        "scope": "user:email",
        "client_id_key": "GITHUB_CLIENT_ID",
        "client_secret_key": "GITHUB_CLIENT_SECRET",
    },
    "microsoft": {
        "auth_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        "userinfo_url": "https://graph.microsoft.com/v1.0/me",
        "scope": "openid email profile",
        "client_id_key": "MICROSOFT_CLIENT_ID",
        "client_secret_key": "MICROSOFT_CLIENT_SECRET",
    },
}


def _callback_url(provider: str) -> str:
    return f"{settings.BACKEND_URL}/api/auth/callback/{provider}"


def _get_client_id(provider: str) -> str:
    return getattr(settings, _PROVIDERS[provider]["client_id_key"])


def _get_client_secret(provider: str) -> str:
    return getattr(settings, _PROVIDERS[provider]["client_secret_key"])


@router.get("/login/{provider}")
async def oauth_login(provider: str):
    if provider not in _PROVIDERS:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=unknown_provider")

    cfg = _PROVIDERS[provider]
    params = {
        "client_id": _get_client_id(provider),
        "redirect_uri": _callback_url(provider),
        "response_type": "code",
        "scope": cfg["scope"],
    }
    return RedirectResponse(url=f"{cfg['auth_url']}?{urllib.parse.urlencode(params)}")


@router.get("/callback/{provider}")
async def oauth_callback(provider: str, code: str = "", error: str = ""):
    if provider not in _PROVIDERS:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=unknown_provider")

    if error or not code:
        return RedirectResponse(url=f"{settings.FRONTEND_URL}?error={urllib.parse.quote(error or 'no_code')}")

    cfg = _PROVIDERS[provider]

    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            cfg["token_url"],
            data={
                "client_id": _get_client_id(provider),
                "client_secret": _get_client_secret(provider),
                "code": code,
                "redirect_uri": _callback_url(provider),
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )
        if token_response.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=token_exchange_failed")

        token_data = token_response.json()
        access_token = token_data.get("access_token", "")
        if not access_token:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=no_access_token")

        userinfo_response = await client.get(
            cfg["userinfo_url"],
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_response.status_code != 200:
            return RedirectResponse(url=f"{settings.FRONTEND_URL}?error=userinfo_failed")

        profile = userinfo_response.json()

    email = (
        profile.get("email")
        or profile.get("mail")
        or profile.get("userPrincipalName")
        or ""
    )
    name = (
        profile.get("name")
        or profile.get("login")
        or profile.get("displayName")
        or email
    )

    jwt_token = create_access_token({"sub": email, "name": name, "provider": provider})
    return RedirectResponse(url=f"{settings.FRONTEND_URL}?token={jwt_token}")
