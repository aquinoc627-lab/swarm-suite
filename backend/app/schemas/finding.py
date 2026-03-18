from datetime import datetime
from pydantic import BaseModel

from app.models.finding import FindingSeverity, FindingStatus


class FindingOut(BaseModel):
    id: str
    scan_id: str
    title: str
    description: str
    severity: FindingSeverity
    category: str
    evidence: str | None
    remediation: str | None
    target: str
    port: int | None
    protocol: str | None
    cve_id: str | None
    status: FindingStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class FindingUpdate(BaseModel):
    status: FindingStatus | None = None
    remediation: str | None = None


class FindingSummary(BaseModel):
    total: int
    by_severity: dict[str, int]
    by_category: dict[str, int]
    by_status: dict[str, int]
