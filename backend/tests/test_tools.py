import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_tools_grouped_by_category(client: AsyncClient, admin_token: str):
    resp = await client.get("/api/tools", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Reconnaissance" in data
    assert "Web Application" in data
    assert "Exploitation" in data


@pytest.mark.asyncio
async def test_get_nmap_tool(client: AsyncClient, admin_token: str):
    resp = await client.get("/api/tools/nmap", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "nmap"
    assert data["name"] == "Nmap Port Scan"
    assert any(p["name"] == "target" for p in data["parameters"])


@pytest.mark.asyncio
async def test_get_nonexistent_tool_returns_404(client: AsyncClient, admin_token: str):
    resp = await client.get("/api/tools/nonexistent_tool_xyz", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tools_require_auth(client: AsyncClient):
    resp = await client.get("/api/tools")
    assert resp.status_code == 401
