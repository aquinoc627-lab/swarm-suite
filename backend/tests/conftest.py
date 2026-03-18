import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.core.database import Base, get_db

TEST_DB = "sqlite+aiosqlite:///./test_swarm.db"


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine(TEST_DB)
    async with engine.begin() as conn:
        from app.models import User, RefreshToken, Agent, Mission, AgentMission, Banter, AuditLog, Scan, Finding  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db: AsyncSession):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def admin_token(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"username": "admin", "email": "admin@test.com", "password": "Admin123!", "role": "admin"},
    )
    resp = await client.post("/api/auth/login", data={"username": "admin", "password": "Admin123!"})
    return resp.json()["access_token"]


@pytest_asyncio.fixture
async def operator_token(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"username": "operator", "email": "operator@test.com", "password": "Operator123!", "role": "operator"},
    )
    resp = await client.post("/api/auth/login", data={"username": "operator", "password": "Operator123!"})
    return resp.json()["access_token"]
