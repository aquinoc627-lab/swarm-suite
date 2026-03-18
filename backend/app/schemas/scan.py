from datetime import datetime
from pydantic import BaseModel

from app.models.scan import ScanStatus


class ScanCreate(BaseModel):
    name: str
    tool_id: str
    target: str
    parameters: dict = {}
    mission_id: str | None = None
    agent_id: str | None = None


class ScanOut(BaseModel):
    id: str
    name: str
    tool_id: str
    target: str
    parameters: dict
    status: ScanStatus
    result: dict | None
    findings_count: int
    severity_summary: dict
    mission_id: str | None
    agent_id: str | None
    launched_by: str
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
