import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    resp = await client.post(
        "/api/auth/register",
        json={"username": "testuser", "email": "testuser@test.com", "password": "Test1234!", "role": "operator"},
    )
    assert resp.status_code == 201

    resp = await client.post("/api/auth/login", data={"username": "testuser", "password": "Test1234!"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"username": "user2", "email": "user2@test.com", "password": "Correct1!", "role": "operator"},
    )
    resp = await client.post("/api/auth/login", data={"username": "user2", "password": "wrong"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, operator_token: str):
    resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {operator_token}"})
    assert resp.status_code == 200
    assert resp.json()["username"] == "operator"


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"username": "refreshuser", "email": "refresh@test.com", "password": "Refresh1!", "role": "operator"},
    )
    login_resp = await client.post("/api/auth/login", data={"username": "refreshuser", "password": "Refresh1!"})
    refresh_token = login_resp.json()["refresh_token"]

    resp = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"username": "logoutuser", "email": "logout@test.com", "password": "Logout1!", "role": "operator"},
    )
    login_resp = await client.post("/api/auth/login", data={"username": "logoutuser", "password": "Logout1!"})
    refresh_token = login_resp.json()["refresh_token"]

    resp = await client.post("/api/auth/logout", json={"refresh_token": refresh_token})
    assert resp.status_code == 200

    # Refresh should now fail
    resp = await client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 401
