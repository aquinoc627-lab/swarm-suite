import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Banter(Base):
    __tablename__ = "banter"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sender: Mapped[str] = mapped_column(String(100), nullable=False)  # agent_id, "system", or "user"
    message_type: Mapped[str] = mapped_column(String(20), default="chat")  # chat/alert/result/status
    mission_id: Mapped[str | None] = mapped_column(String, ForeignKey("missions.id"), nullable=True)
    agent_id: Mapped[str | None] = mapped_column(String, ForeignKey("agents.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    mission: Mapped["Mission | None"] = relationship("Mission", back_populates="banter")
    agent: Mapped["Agent | None"] = relationship("Agent", back_populates="banter")
