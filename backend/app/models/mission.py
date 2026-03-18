import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Mission(Base):
    __tablename__ = "missions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="planned")
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    target: Mapped[str] = mapped_column(String(200), nullable=False)
    objectives: Mapped[list] = mapped_column(JSON, default=list)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    agents: Mapped[list["AgentMission"]] = relationship("AgentMission", back_populates="mission")
    scans: Mapped[list["Scan"]] = relationship("Scan", back_populates="mission")
    banter: Mapped[list["Banter"]] = relationship("Banter", back_populates="mission")


class AgentMission(Base):
    __tablename__ = "agent_missions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id: Mapped[str] = mapped_column(String, ForeignKey("agents.id"), nullable=False)
    mission_id: Mapped[str] = mapped_column(String, ForeignKey("missions.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(100), default="operator")
    joined_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    agent: Mapped["Agent"] = relationship("Agent", back_populates="missions")
    mission: Mapped["Mission"] = relationship("Mission", back_populates="agents")
