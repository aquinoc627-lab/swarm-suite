import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ScanStatus(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


_DEFAULT_SEVERITY_SUMMARY = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    tool_id: Mapped[str] = mapped_column(String(50), nullable=False)
    target: Mapped[str] = mapped_column(String(500), nullable=False)
    parameters: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[ScanStatus] = mapped_column(Enum(ScanStatus), default=ScanStatus.queued, nullable=False)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    raw_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    findings_count: Mapped[int] = mapped_column(Integer, default=0)
    severity_summary: Mapped[dict] = mapped_column(JSON, default=lambda: dict(_DEFAULT_SEVERITY_SUMMARY))
    mission_id: Mapped[str | None] = mapped_column(String, ForeignKey("missions.id"), nullable=True)
    agent_id: Mapped[str | None] = mapped_column(String, ForeignKey("agents.id"), nullable=True)
    launched_by: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    mission: Mapped["Mission | None"] = relationship("Mission", back_populates="scans")
    agent: Mapped["Agent | None"] = relationship("Agent", back_populates="scans")
    launcher: Mapped["User"] = relationship("User", foreign_keys=[launched_by], back_populates="scans")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="scan")
