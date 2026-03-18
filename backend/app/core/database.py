from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from .config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session_maker() as session:
        yield session


async def create_tables():
    async with engine.begin() as conn:
        # Import all models so metadata is populated
        from app.models import User, RefreshToken, Agent, Mission, AgentMission, Banter, AuditLog, Scan, Finding  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
