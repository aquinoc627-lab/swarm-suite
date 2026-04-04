import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport
import socket

# Import the FastAPI app instance from backend/main.py
from main import app

@pytest.fixture
async def main_client():
    """Provide an async HTTPX test client bound to the legacy main app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_validate_missing_hostname(main_client):
    """Test that URLs with missing hostnames are rejected."""
    # The 'http://' string parses to an empty hostname.
    resp = await main_client.get("/api/validate", params={"target_url": "http://"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "error"
    assert "missing hostname" in data["message"]

@pytest.mark.asyncio
async def test_validate_prepends_http_and_rejects_missing_hostname(main_client):
    """Test that missing hostname after prepending http:// is rejected."""
    # E.g. passing an empty string or something that doesn't form a valid host
    resp = await main_client.get("/api/validate", params={"target_url": ""})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "error"
    assert "missing hostname" in data["message"]

@pytest.mark.asyncio
async def test_validate_rejects_private_ip(main_client):
    """Test that private/internal IP addresses are blocked for SSRF prevention."""
    with patch("socket.gethostbyname", return_value="192.168.1.1"):
        resp = await main_client.get("/api/validate", params={"target_url": "http://internal-server.local"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "error"
        assert "Scanning private or internal IP addresses is not permitted." in data["message"]

@pytest.mark.asyncio
async def test_validate_rejects_loopback_ip(main_client):
    """Test that loopback IP addresses (like localhost) are blocked."""
    with patch("socket.gethostbyname", return_value="127.0.0.1"):
        resp = await main_client.get("/api/validate", params={"target_url": "http://localhost"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "error"
        assert "Scanning private or internal IP addresses is not permitted." in data["message"]

@pytest.mark.asyncio
async def test_validate_unresolvable_host(main_client):
    """Test handling of unresolvable hostnames."""
    with patch("socket.gethostbyname", side_effect=socket.gaierror("Name or service not known")):
        resp = await main_client.get("/api/validate", params={"target_url": "http://this-host-does-not-exist.com"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "error"
        assert "Could not resolve host: this-host-does-not-exist.com" in data["message"]

@pytest.mark.asyncio
async def test_validate_value_error_ip(main_client):
    """Test handling of invalid IP addresses returned by socket resolution."""
    with patch("socket.gethostbyname", return_value="not-an-ip"):
        resp = await main_client.get("/api/validate", params={"target_url": "http://example.com"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "error"
        assert "Invalid target URL." in data["message"]

@pytest.mark.asyncio
async def test_validate_success(main_client):
    """Test successful validation and scanning of a valid, public URL."""
    # Mock socket resolution to return a public IP
    with patch("socket.gethostbyname", return_value="8.8.8.8"):
        # Mock requests.get inside asyncio.to_thread
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {
            "Server": "TestServer",
            "Strict-Transport-Security": "max-age=31536000",
            "Content-Type": "text/html"
        }

        # We need to mock asyncio.to_thread since the main code uses it
        with patch("asyncio.to_thread", return_value=mock_response):
            resp = await main_client.get("/api/validate", params={"target_url": "http://example.com"})
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "success"

            # Check response structure
            assert "data" in data
            assert data["data"]["target"] == "http://example.com/"
            assert data["data"]["server_info"] == "TestServer"

            # Check headers parsing
            assert "strict-transport-security" in data["data"]["present_headers"]
            missing_headers = [h["header"] for h in data["data"]["missing_headers"]]
            assert "x-frame-options" in missing_headers
