from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.audit_log import AuditLog
from app.models.finding import Finding, FindingSeverity, FindingStatus
from app.models.user import User
from app.schemas.finding import FindingOut, FindingSummary, FindingUpdate

router = APIRouter()


@router.get("", response_model=list[FindingOut])
async def list_findings(
    severity: FindingSeverity | None = Query(None),
    category: str | None = Query(None),
    find_status: FindingStatus | None = Query(None, alias="status"),
    scan_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Finding).order_by(Finding.created_at.desc()).offset(skip).limit(limit)
    if severity:
        q = q.where(Finding.severity == severity)
    if category:
        q = q.where(Finding.category == category)
    if find_status:
        q = q.where(Finding.status == find_status)
    if scan_id:
        q = q.where(Finding.scan_id == scan_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/summary", response_model=FindingSummary)
async def findings_summary(db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Finding))
    findings = result.scalars().all()

    total = len(findings)
    by_severity: dict[str, int] = {s.value: 0 for s in FindingSeverity}
    by_status: dict[str, int] = {s.value: 0 for s in FindingStatus}
    by_category: dict[str, int] = {}

    for f in findings:
        by_severity[f.severity.value] = by_severity.get(f.severity.value, 0) + 1
        by_status[f.status.value] = by_status.get(f.status.value, 0) + 1
        by_category[f.category] = by_category.get(f.category, 0) + 1

    return FindingSummary(total=total, by_severity=by_severity, by_category=by_category, by_status=by_status)


@router.get("/{finding_id}", response_model=FindingOut)
async def get_finding(finding_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Finding).where(Finding.id == finding_id))
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    return finding


@router.patch("/{finding_id}", response_model=FindingOut)
async def update_finding(
    finding_id: str,
    payload: FindingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "operator")),
):
    result = await db.execute(select(Finding).where(Finding.id == finding_id))
    finding = result.scalar_one_or_none()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(finding, field, value)
    await db.commit()

    log = AuditLog(
        user_id=current_user.id,
        action="finding.update",
        resource_type="finding",
        resource_id=finding_id,
        details=payload.model_dump(exclude_unset=True),
    )
    db.add(log)
    await db.commit()
    await db.refresh(finding)
    return finding
