"""
Tests for the Agents API (/api/agents).
"""

import pytest
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_create_agent(client, admin_token):
    """Should create an agent and return 201."""
    resp = await client.post(
        "/api/agents",
        json={"name": "Test-Agent-Alpha", "description": "Test agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Test-Agent-Alpha"
    assert data["status"] == "idle"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_agent_duplicate_name(client, admin_token):
    """Duplicate agent name should return 409."""
    await client.post(
        "/api/agents",
        json={"name": "Duplicate-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    resp = await client.post(
        "/api/agents",
        json={"name": "Duplicate-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_list_agents(client, admin_token):
    """Should return a list of agents."""
    resp = await client.get("/api/agents", headers=auth_headers(admin_token))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_list_agents_filter_status(client, admin_token):
    """Should filter agents by status."""
    # Create agents with different statuses
    await client.post(
        "/api/agents",
        json={"name": "Active-Filter-Test", "status": "active"},
        headers=auth_headers(admin_token),
    )
    resp = await client.get(
        "/api/agents?status=active",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    agents = resp.json()
    for agent in agents:
        assert agent["status"] == "active"


@pytest.mark.asyncio
async def test_get_agent_by_id(client, admin_token):
    """Should return a single agent by ID."""
    create_resp = await client.post(
        "/api/agents",
        json={"name": "Get-By-ID-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = create_resp.json()["id"]

    resp = await client.get(
        f"/api/agents/{agent_id}",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    assert resp.json()["id"] == agent_id


@pytest.mark.asyncio
async def test_get_agent_not_found(client, admin_token):
    """Non-existent agent ID should return 404."""
    resp = await client.get(
        "/api/agents/nonexistent-id",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_agent(client, admin_token):
    """Should update an agent's fields."""
    create_resp = await client.post(
        "/api/agents",
        json={"name": "Update-Test-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/agents/{agent_id}",
        json={"status": "active", "description": "Now active"},
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "active"
    assert data["description"] == "Now active"


@pytest.mark.asyncio
async def test_delete_agent_admin(client, admin_token):
    """Admin should be able to delete an agent."""
    create_resp = await client.post(
        "/api/agents",
        json={"name": "Delete-Test-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/agents/{agent_id}",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 204

    # Verify it's gone
    get_resp = await client.get(
        f"/api/agents/{agent_id}",
        headers=auth_headers(admin_token),
    )
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_agent_operator_forbidden(client, admin_token, operator_token):
    """Operators should not be able to delete agents."""
    create_resp = await client.post(
        "/api/agents",
        json={"name": "No-Delete-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = create_resp.json()["id"]

    resp = await client.delete(
        f"/api/agents/{agent_id}",
        headers=auth_headers(operator_token),
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_agent_unauthenticated(client):
    """Unauthenticated requests should be rejected."""
    resp = await client.post(
        "/api/agents",
        json={"name": "Unauth-Agent", "status": "idle"},
    )
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_create_agent_with_persona(client, admin_token):
    """Creating an agent with a persona dict should succeed and return persona fields."""
    resp = await client.post(
        "/api/agents",
        json={
            "name": "Persona-Agent",
            "status": "idle",
            "persona": {
                "avatar_color": "#ff0000",
                "icon": "brain",
                "personality": "strategic",
                "voice_style": "assertive",
            },
        },
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Persona-Agent"
    assert data["persona"] is not None
    assert data["persona"]["icon"] == "brain"
    assert data["persona"]["personality"] == "strategic"


@pytest.mark.asyncio
async def test_update_agent_with_persona(client, admin_token):
    """Updating an agent's persona should persist the new persona data."""
    create_resp = await client.post(
        "/api/agents",
        json={"name": "Persona-Update-Agent", "status": "idle"},
        headers=auth_headers(admin_token),
    )
    agent_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/agents/{agent_id}",
        json={
            "persona": {
                "avatar_color": "#00ff00",
                "icon": "crosshair",
                "personality": "aggressive",
                "voice_style": "urgent",
            }
        },
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["persona"]["icon"] == "crosshair"
    assert data["persona"]["personality"] == "aggressive"
