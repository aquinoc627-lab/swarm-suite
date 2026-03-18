import pytest
from httpx import AsyncClient


async def _create_scan(client: AsyncClient, token: str, **kwargs) -> dict:
    payload = {
        "name": "Test Scan",
        "tool_id": "nmap",
        "target": "192.168.1.1",
        "parameters": {"ports": "1-100"},
        **kwargs,
    }
    resp = await client.post("/api/scans", json=payload, headers={"Authorization": f"Bearer {token}"})
    return resp


@pytest.mark.asyncio
async def test_create_scan_returns_queued(client: AsyncClient, operator_token: str):
    resp = await _create_scan(client, operator_token)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "queued"
    assert data["tool_id"] == "nmap"
    assert data["target"] == "192.168.1.1"


@pytest.mark.asyncio
async def test_list_scans(client: AsyncClient, operator_token: str):
    await _create_scan(client, operator_token)
    resp = await client.get("/api/scans", headers={"Authorization": f"Bearer {operator_token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_get_scan_by_id(client: AsyncClient, operator_token: str):
    create_resp = await _create_scan(client, operator_token)
    scan_id = create_resp.json()["id"]

    resp = await client.get(f"/api/scans/{scan_id}", headers={"Authorization": f"Bearer {operator_token}"})
    assert resp.status_code == 200
    assert resp.json()["id"] == scan_id


@pytest.mark.asyncio
async def test_get_nonexistent_scan_returns_404(client: AsyncClient, operator_token: str):
    resp = await client.get("/api/scans/nonexistent-id", headers={"Authorization": f"Bearer {operator_token}"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_scan_requires_admin(client: AsyncClient, operator_token: str, admin_token: str):
    create_resp = await _create_scan(client, admin_token)
    scan_id = create_resp.json()["id"]

    # Operator cannot delete
    resp = await client.delete(f"/api/scans/{scan_id}", headers={"Authorization": f"Bearer {operator_token}"})
    assert resp.status_code == 403

    # Admin can delete
    resp = await client.delete(f"/api/scans/{scan_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_get_scan_findings(client: AsyncClient, operator_token: str):
    create_resp = await _create_scan(client, operator_token)
    scan_id = create_resp.json()["id"]

    resp = await client.get(f"/api/scans/{scan_id}/findings", headers={"Authorization": f"Bearer {operator_token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_scan_invalid_target_command_injection(client: AsyncClient, operator_token: str):
    for bad_char in [";", "|", "&", "`", "$", ">", "<"]:
        resp = await _create_scan(client, operator_token, target=f"192.168.1.1{bad_char}rm -rf /")
        assert resp.status_code == 422, f"Expected 422 for char {bad_char!r}"


@pytest.mark.asyncio
async def test_create_scan_unknown_tool(client: AsyncClient, operator_token: str):
    resp = await _create_scan(client, operator_token, tool_id="totally_fake_tool")
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_scan_requires_auth(client: AsyncClient):
    resp = await client.get("/api/scans")
    assert resp.status_code == 401
