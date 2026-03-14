"""
Tests for the Banter API (/api/banter).
"""

import pytest
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_create_banter(client, admin_token):
    """Should create a banter message and return 201."""
    resp = await client.post(
        "/api/banter",
        json={"message": "Hello from test!", "message_type": "chat"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["message"] == "Hello from test!"
    assert data["message_type"] == "chat"
    assert data["sender_id"] is not None


@pytest.mark.asyncio
async def test_create_banter_with_mission(client, admin_token):
    """Should create banter linked to a mission."""
    mission_resp = await client.post(
        "/api/missions",
        json={"name": "Banter Mission Test", "status": "pending", "priority": "low"},
        headers=auth_headers(admin_token),
    )
    mission_id = mission_resp.json()["id"]

    resp = await client.post(
        "/api/banter",
        json={
            "message": "Mission-linked banter",
            "message_type": "status_update",
            "mission_id": mission_id,
        },
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 201
    assert resp.json()["mission_id"] == mission_id


@pytest.mark.asyncio
async def test_list_banter(client, admin_token):
    """Should return a list of banter messages."""
    resp = await client.get("/api/banter", headers=auth_headers(admin_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_list_banter_filter_mission(client, admin_token):
    """Should filter banter by mission_id."""
    mission_resp = await client.post(
        "/api/missions",
        json={"name": "Filter Banter Mission", "status": "pending", "priority": "low"},
        headers=auth_headers(admin_token),
    )
    mission_id = mission_resp.json()["id"]

    await client.post(
        "/api/banter",
        json={"message": "Filtered message", "message_type": "chat", "mission_id": mission_id},
        headers=auth_headers(admin_token),
    )

    resp = await client.get(
        f"/api/banter?mission_id={mission_id}",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    for b in resp.json():
        assert b["mission_id"] == mission_id


@pytest.mark.asyncio
async def test_list_banter_filter_type(client, admin_token):
    """Should filter banter by message_type."""
    await client.post(
        "/api/banter",
        json={"message": "Alert test", "message_type": "alert"},
        headers=auth_headers(admin_token),
    )

    resp = await client.get(
        "/api/banter?message_type=alert",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    for b in resp.json():
        assert b["message_type"] == "alert"


@pytest.mark.asyncio
async def test_get_banter_by_id(client, admin_token):
    """Should return a single banter message by ID."""
    create_resp = await client.post(
        "/api/banter",
        json={"message": "Get by ID test", "message_type": "chat"},
        headers=auth_headers(admin_token),
    )
    banter_id = create_resp.json()["id"]

    resp = await client.get(
        f"/api/banter/{banter_id}",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == banter_id


@pytest.mark.asyncio
async def test_get_banter_not_found(client, admin_token):
    """Non-existent banter ID should return 404."""
    resp = await client.get(
        "/api/banter/nonexistent-id",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_banter_admin(client, admin_token):
    """Admin should be able to delete banter."""
    create_resp = await client.post(
        "/api/banter",
        json={"message": "Delete me", "message_type": "chat"},
        headers=auth_headers(admin_token),
    )
    banter_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/banter/{banter_id}",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_banter_operator_forbidden(client, admin_token, operator_token):
    """Operators should not be able to delete banter."""
    create_resp = await client.post(
        "/api/banter",
        json={"message": "No delete", "message_type": "chat"},
        headers=auth_headers(admin_token),
    )
    banter_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/banter/{banter_id}",
        headers=auth_headers(operator_token),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_banter_pagination(client, admin_token):
    """Should respect limit and offset parameters."""
    # Create several messages
    for i in range(5):
        await client.post(
            "/api/banter",
            json={"message": f"Pagination test {i}", "message_type": "chat"},
            headers=auth_headers(admin_token),
        )

    resp = await client.get(
        "/api/banter?limit=2&offset=0",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    assert len(resp.json()) <= 2


@pytest.mark.asyncio
async def test_create_banter_empty_message(client, admin_token):
    """Empty message should be rejected by validation."""
    resp = await client.post(
        "/api/banter",
        json={"message": "", "message_type": "chat"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_banter_invalid_type(client, admin_token):
    """Invalid message_type should be rejected."""
    resp = await client.post(
        "/api/banter",
        json={"message": "Test", "message_type": "invalid_type"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 422
