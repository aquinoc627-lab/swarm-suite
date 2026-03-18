import re

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.scan_engine import process_scan
from app.core.security import get_current_user, require_role
from app.core.tool_registry import get_tool
from app.models.audit_log import AuditLog
from app.models.finding import Finding
from app.models.scan import Scan, ScanStatus
from app.models.user import User
from app.schemas.finding import FindingOut
from app.schemas.scan import ScanCreate, ScanOut

router = APIRouter()

# Characters that could be used for command injection
_DANGEROUS_CHARS = re.compile(r"[;|&`$><]")


def _validate_target(target: str) -> str:
    if _DANGEROUS_CHARS.search(target):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Target contains invalid characters. Characters ;|&`$>< are not allowed.",
        )
    return target


@router.get("", response_model=list[ScanOut])
async def list_scans(
    scan_status: ScanStatus | None = Query(None, alias="status"),
    tool_id: str | None = Query(None),
    mission_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = select(Scan).order_by(Scan.created_at.desc()).offset(skip).limit(limit)
    if scan_status:
        q = q.where(Scan.status == scan_status)
    if tool_id:
        q = q.where(Scan.tool_id == tool_id)
    if mission_id:
        q = q.where(Scan.mission_id == mission_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ScanOut, status_code=status.HTTP_201_CREATED)
async def launch_scan(
    payload: ScanCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "operator")),
):
    _validate_target(payload.target)

    tool = get_tool(payload.tool_id)
    if not tool:
        raise HTTPException(status_code=400, detail=f"Unknown tool: {payload.tool_id}")

    # Validate required parameters
    for param in tool.get("parameters", []):
        if param.get("required") and param["name"] not in payload.parameters:
            # Allow target to come from payload.target
            if param["name"] == "target":
                continue
            raise HTTPException(
                status_code=422,
                detail=f"Missing required parameter: {param['name']}",
            )

    scan = Scan(
        name=payload.name,
        tool_id=payload.tool_id,
        target=payload.target,
        parameters=payload.parameters,
        mission_id=payload.mission_id,
        agent_id=payload.agent_id,
        launched_by=current_user.id,
        status=ScanStatus.queued,
    )
    db.add(scan)
    await db.commit()
    await db.refresh(scan)

    # Audit log
    log = AuditLog(
        user_id=current_user.id,
        action="scan.launch",
        resource_type="scan",
        resource_id=scan.id,
        details={"tool_id": scan.tool_id, "target": scan.target},
    )
    db.add(log)
    await db.commit()

    background_tasks.add_task(process_scan, scan.id)
    return scan


@router.get("/{scan_id}", response_model=ScanOut)
async def get_scan(scan_id: str, db: AsyncSession = Depends(get_db), _: User = Depends(get_current_user)):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(
    scan_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    scan = result.scalar_one_or_none()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if scan.status == ScanStatus.running:
        scan.status = ScanStatus.cancelled
        await db.commit()
    else:
        await db.delete(scan)
        await db.commit()


@router.get("/{scan_id}/findings", response_model=list[FindingOut])
async def get_scan_findings(
    scan_id: str,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Scan).where(Scan.id == scan_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Scan not found")

    result = await db.execute(select(Finding).where(Finding.scan_id == scan_id))
    return result.scalars().all()
