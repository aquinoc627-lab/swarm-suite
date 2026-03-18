from datetime import datetime
from pydantic import BaseModel


class MissionCreate(BaseModel):
    title: str
    description: str
    status: str = "planned"
    priority: str = "medium"
    target: str
    objectives: list = []


class MissionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    target: str | None = None
    objectives: list | None = None


class MissionOut(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    target: str
    objectives: list
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AssignAgentRequest(BaseModel):
    agent_id: str
    role: str = "operator"
