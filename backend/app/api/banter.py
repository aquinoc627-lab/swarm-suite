from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.banter import Banter
from app.models.user import User

router = APIRouter()


class BanterCreate(BaseModel):
    content: str
    sender: str = "user"
    message_type: str = "chat"
    mission_id: str | None = None
    agent_id: str | None = None


class BanterOut(BaseModel):
    id: str
    content: str
    sender: str
    message_type: str
    mission_id: str | None
    agent_id: str | None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[BanterOut])
async def list_banter(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Banter).order_by(Banter.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


@router.post("", response_model=BanterOut, status_code=status.HTTP_201_CREATED)
async def create_banter(
    payload: BanterCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    msg = Banter(**payload.model_dump())
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    from app.api.websocket import manager
    await manager.broadcast({"event": "banter", "data": {"content": msg.content, "sender": msg.sender}})

    return msg
