from datetime import datetime
from pydantic import BaseModel


class AgentCreate(BaseModel):
    name: str
    codename: str
    status: str = "idle"
    persona: dict = {}
    capabilities: list = []


class AgentUpdate(BaseModel):
    name: str | None = None
    codename: str | None = None
    status: str | None = None
    persona: dict | None = None
    capabilities: list | None = None


class AgentOut(BaseModel):
    id: str
    name: str
    codename: str
    status: str
    persona: dict
    capabilities: list
    last_seen: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
