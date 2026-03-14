"""
Tests for the Missions API (/api/missions).
"""

import pytest
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_create_mission(client, admin_token):
    """Should create a mission and return 201."""
    resp = await client.post(
        "/api/missions",
        json={
            "name": "Test Mission Alpha",
            "description": "A test mission",
            "status": "pending",
            "priority": "high",
        },
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test Mission Alpha"
    assert data["status"] == "pending"
    assert data["priority"] == "high"


@pytest.mark.asyncio
async def test_list_missions(client, admin_token):
    """Should return a list of missions."""
    resp = await client.get("/api/missions", headers=auth_headers(admin_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_list_missions_filter_status(client, admin_token):
    """Should filter missions by status."""
    await client.post(
        "/api/missions",
        json={"name": "Pending Filter Test", "status": "pending", "priority": "low"},
        headers=auth_headers(admin_token),
    )
    resp = await client.get(
        "/api/missions?status=pending",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    for m in resp.json():
        assert m["status"] == "pending"


@pytest.mark.asyncio
async def test_list_missions_filter_priority(client, admin_token):
    """Should filter missions by priority."""
    await client.post(
        "/api/missions",
        json={"name": "Critical Priority Test", "status": "pending", "priority": "critical"},
        headers=auth_headers(admin_token),
    )
    resp = await client.get(
        "/api/missions?priority=critical",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    for m in resp.json():
        assert m["priority"] == "critical"


@pytest.mark.asyncio
async def test_get_mission_by_id(client, admin_token):
    """Should return a single mission by ID."""
    create_resp = await client.post(
        "/api/missions",
        json={"name": "Get By ID Mission", "status": "pending", "priority": "medium"},
        headers=auth_headers(admin_token),
    )
    mission_id = create_resp.json()["id"]

    resp = await client.get(
        f"/api/missions/{mission_id}",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == mission_id


@pytest.mark.asyncio
async def test_get_mission_not_found(client, admin_token):
    """Non-existent mission ID should return 404."""
    resp = await client.get(
        "/api/missions/nonexistent-id",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_mission(client, admin_token):
    """Should update a mission's fields."""
    create_resp = await client.post(
        "/api/missions",
        json={"name": "Update Test Mission", "status": "pending", "priority": "low"},
        headers=auth_headers(admin_token),
    )
    mission_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/missions/{mission_id}",
        json={"status": "in_progress", "priority": "high"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "in_progress"
    assert data["priority"] == "high"
    assert data["started_at"] is not None  # Auto-set on in_progress


@pytest.mark.asyncio
async def test_update_mission_completion(client, admin_token):
    """Completing a mission should auto-set completed_at."""
    create_resp = await client.post(
        "/api/missions",
        json={"name": "Complete Test Mission", "status": "in_progress", "priority": "medium"},
        headers=auth_headers(admin_token),
    )
    mission_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/missions/{mission_id}",
        json={"status": "completed"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["completed_at"] is not None


@pytest.mark.asyncio
async def test_delete_mission_admin(client, admin_token):
    """Admin should be able to delete a mission."""
    create_resp = await client.post(
        "/api/missions",
        json={"name": "Delete Test Mission", "status": "pending", "priority": "low"},
        headers=auth_headers(admin_token),
    )
    mission_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/missions/{mission_id}",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_mission_operator_forbidden(client, admin_token, operator_token):
    """Operators should not be able to delete missions."""
    create_resp = await client.post(
        "/api/missions",
        json={"name": "No Delete Mission", "status": "pending", "priority": "low"},
        headers=auth_headers(admin_token),
    )
    mission_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/missions/{mission_id}",
        headers=auth_headers(operator_token),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_assign_agent_to_mission(client, admin_token):
    """Should assign an agent to a mission."""
    # Create agent
    agent_resp = await client.post(
        "/api/agents",
        json={"name": "Assign-Test-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = agent_resp.json()["id"]

    # Create mission
    mission_resp = await client.post(
        "/api/missions",
        json={"name": "Assign Test Mission", "status": "pending", "priority": "medium"},
        headers=auth_headers(admin_token),
    )
    mission_id = mission_resp.json()["id"]

    # Assign
    resp = await client.post(
        f"/api/missions/{mission_id}/assign",
        json={"agent_id": agent_id, "mission_id": mission_id},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["agent_id"] == agent_id
    assert data["mission_id"] == mission_id


@pytest.mark.asyncio
async def test_assign_duplicate(client, admin_token):
    """Duplicate assignment should return 409."""
    agent_resp = await client.post(
        "/api/agents",
        json={"name": "Dup-Assign-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = agent_resp.json()["id"]

    mission_resp = await client.post(
        "/api/missions",
        json={"name": "Dup Assign Mission", "status": "pending", "priority": "medium"},
        headers=auth_headers(admin_token),
    )
    mission_id = mission_resp.json()["id"]

    await client.post(
        f"/api/missions/{mission_id}/assign",
        json={"agent_id": agent_id, "mission_id": mission_id},
        headers=auth_headers(admin_token),
    )

    resp = await client.post(
        f"/api/missions/{mission_id}/assign",
        json={"agent_id": agent_id, "mission_id": mission_id},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_revoke_agent_from_mission(client, admin_token):
    """Should revoke an agent from a mission."""
    agent_resp = await client.post(
        "/api/agents",
        json={"name": "Revoke-Test-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = agent_resp.json()["id"]

    mission_resp = await client.post(
        "/api/missions",
        json={"name": "Revoke Test Mission", "status": "pending", "priority": "medium"},
        headers=auth_headers(admin_token),
    )
    mission_id = mission_resp.json()["id"]

    await client.post(
        f"/api/missions/{mission_id}/assign",
        json={"agent_id": agent_id, "mission_id": mission_id},
        headers=auth_headers(admin_token),
    )

    resp = await client.delete(
        f"/api/missions/{mission_id}/assign/{agent_id}",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_get_mission_agents(client, admin_token):
    """Should return agents assigned to a mission."""
    agent_resp = await client.post(
        "/api/agents",
        json={"name": "Mission-Agents-Test", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = agent_resp.json()["id"]

    mission_resp = await client.post(
        "/api/missions",
        json={"name": "Mission Agents Test", "status": "pending", "priority": "medium"},
        headers=auth_headers(admin_token),
    )
    mission_id = mission_resp.json()["id"]

    await client.post(
        f"/api/missions/{mission_id}/assign",
        json={"agent_id": agent_id, "mission_id": mission_id},
        headers=auth_headers(admin_token),
    )

    resp = await client.get(
        f"/api/missions/{mission_id}/agents",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    agents = resp.json()
    assert any(a["id"] == agent_id for a in agents)
