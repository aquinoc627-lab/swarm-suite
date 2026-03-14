"""
Tests for the Analytics API (/api/analytics).
"""

import pytest
from tests.conftest import auth_headers


@pytest.mark.asyncio
async def test_overview(client, admin_token):
    """Should return overview statistics."""
    resp = await client.get(
        "/api/analytics/overview",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "totals" in data
    assert "agent_statuses" in data
    assert "mission_statuses" in data
    assert "mission_priorities" in data
    assert "websocket_connections" in data


@pytest.mark.asyncio
async def test_activity(client, admin_token):
    """Should return 7-day activity data."""
    resp = await client.get(
        "/api/analytics/activity",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "daily_activity" in data
    assert len(data["daily_activity"]) == 7
    assert "banter_by_type" in data


@pytest.mark.asyncio
async def test_health(client, admin_token):
    """Should return system health metrics."""
    resp = await client.get(
        "/api/analytics/health",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "agent_availability" in data
    assert "mission_completion_rate" in data
    assert "status" in data
    assert data["status"] == "operational"
    assert "online_users" in data


@pytest.mark.asyncio
async def test_presence(client, admin_token):
    """Should return online users list."""
    resp = await client.get(
        "/api/analytics/presence",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "online_users" in data
    assert "online_count" in data
    assert isinstance(data["online_users"], list)


@pytest.mark.asyncio
async def test_audit_log(client, admin_token):
    """Should return audit log entries."""
    resp = await client.get(
        "/api/analytics/audit",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    # Should have entries from previous test operations
    if len(data) > 0:
        entry = data[0]
        assert "action" in entry
        assert "entity_type" in entry
        assert "created_at" in entry


@pytest.mark.asyncio
async def test_audit_log_admin_sees_details(client, admin_token):
    """Admin should see full details in audit log."""
    # Create something to generate an audit entry
    await client.post(
        "/api/agents",
        json={"name": "Audit-Detail-Test", "status": "idle"},
        headers=auth_headers(admin_token),
    )

    resp = await client.get(
        "/api/analytics/audit?limit=5",
        headers=auth_headers(admin_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    # Admin should see details and ip_address
    create_entries = [e for e in data if e["action"] == "create"]
    if create_entries:
        assert create_entries[0]["details"] is not None


@pytest.mark.asyncio
async def test_audit_log_operator_hides_details(client, operator_token):
    """Operator should not see sensitive details in audit log."""
    resp = await client.get(
        "/api/analytics/audit?limit=5",
        headers=auth_headers(operator_token),
    )
    assert resp.status_code == 200
    data = resp.json()
    for entry in data:
        assert entry["details"] is None
        assert entry["ip_address"] is None


@pytest.mark.asyncio
async def test_analytics_unauthenticated(client):
    """Unauthenticated requests should be rejected."""
    for endpoint in ["/api/analytics/overview", "/api/analytics/activity", "/api/analytics/health"]:
        resp = await client.get(endpoint)
        assert resp.status_code in (401, 403)
