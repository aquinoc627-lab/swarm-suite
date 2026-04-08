# Autonomous — Production Deployment Guide

This guide provides comprehensive instructions for deploying Autonomous in a production environment using Docker and Nginx.

---

## 1. Prerequisites

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| Docker | 24.x | [Install Docker](https://docs.docker.com/engine/install/) |
| Docker Compose | 2.x | Included with Docker Desktop |
| A domain name | — | Pointing to your server's public IP |
| SSL/TLS certificate | — | Recommended: [Let's Encrypt](https://letsencrypt.org/) via Certbot |

> **Minimum server specs**: 2 vCPU, 4 GB RAM, 20 GB SSD. For heavier workloads with many active agents, use 4 vCPU / 8 GB RAM.

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the repository root and update every value:

```bash
cp .env.example .env
nano .env
```

```env
# ── Backend ─────────────────────────────────────────────────────────────────

# REQUIRED: Generate with:
#   python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=your-production-secret-key-here

# Allowed frontend origin(s) — must match your domain exactly
CORS_ORIGINS=https://your-domain.com

# PostgreSQL connection string (Docker service name "db" resolves inside Compose)
DATABASE_URL=postgresql+asyncpg://autonomous_user:autonomous_password@db:5432/autonomous_db

# REQUIRED: Google Gemini API key for Agent Brain and Memory Palace
# Obtain at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-api-key-here

# OPTIONAL: GitHub Personal Access Token for DevOps agent features
GITHUB_TOKEN=

# JWT token lifetimes
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Authentication mode: "jwt" or "oauth"
AUTH_MODE=jwt

# ── Frontend ────────────────────────────────────────────────────────────────

# URL the browser uses to reach the backend API
REACT_APP_API_URL=https://api.your-domain.com

# ── Database ────────────────────────────────────────────────────────────────

POSTGRES_USER=autonomous_user
POSTGRES_PASSWORD=autonomous_password
POSTGRES_DB=autonomous_db
```

> ⚠️ **Never commit your `.env` file to version control.** It is listed in `.gitignore` by default.

---

## 3. Deployment Steps

### 3.1 Clone the Repository

```bash
git clone https://github.com/aquinoc627-lab/autonomous.git
cd autonomous
```

### 3.2 Configure Environment

```bash
cp .env.example .env
# Edit .env with your production values (see Section 2)
```

### 3.3 Build and Start the Containers

```bash
docker-compose up -d --build
```

Docker Compose will:
1. Pull the `postgres:15-alpine` database image
2. Build the FastAPI backend image
3. Build the React frontend image (served via Nginx)
4. Start all services in dependency order (database → backend → frontend)
5. Run Alembic database migrations on backend startup
6. Seed initial data (if the database is empty)

### 3.4 Verify the Deployment

```bash
# Check all containers are running
docker-compose ps

# View startup logs
docker-compose logs -f backend

# Health check endpoints
curl http://localhost:8000/api/health   # {"status":"ok"}
curl http://localhost:3000              # Should return the React index.html
```

Expected service URLs:

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` (or `https://your-domain.com`) |
| Backend API | `http://localhost:8000` (or `https://api.your-domain.com`) |
| API Docs (OpenAPI) | `http://localhost:8000/docs` |

---

## 4. SSL / Reverse Proxy Configuration

For production, place Nginx (or Traefik) in front of the containers to handle SSL termination.

### Example: Nginx Reverse Proxy with Certbot

```nginx
# /etc/nginx/sites-available/autonomous
server {
    listen 80;
    server_name your-domain.com api.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Obtain and auto-renew Let's Encrypt certificates:

```bash
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

---

## 5. Security Hardening

### 5.1 Secrets and Keys
- **Rotate** `SECRET_KEY` and all database passwords before first deployment.
- **Rotate** `GEMINI_API_KEY` periodically and revoke any compromised keys immediately.
- Store secrets in a secrets manager (HashiCorp Vault, AWS Secrets Manager, GitHub Actions Secrets) — never in the repository.

### 5.2 Network / Firewall
- Restrict access to ports **8000** and **5432** at the firewall level; they should only be reachable from within the Docker network.
- Expose only ports **80** and **443** publicly (through your reverse proxy).
- Use `ufw` or your cloud provider's security groups:
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP (redirects to HTTPS)
  sudo ufw allow 443/tcp   # HTTPS
  sudo ufw enable
  ```

### 5.3 Docker Socket (Ghost Protocol)
The backend mounts `/var/run/docker.sock` to support the Ghost Protocol lab management feature. This grants the backend container full control over the host Docker daemon. Ensure:
- Only trusted users hold the `admin` role.
- The server is not publicly accessible on unprotected ports.
- Consider using a Docker socket proxy (e.g., `tecnativa/docker-socket-proxy`) to limit the API surface exposed to the backend.

### 5.4 Tool Arsenal Execution
The Tool Arsenal engine includes built-in command sanitization and confirmation gates for dangerous tools (e.g., Metasploit, Cobalt Strike). Only grant the `admin` role to trusted users, as admins can bypass confirmation gates.

### 5.5 Database Security
- Use a strong, unique `POSTGRES_PASSWORD` (minimum 32 characters, randomly generated).
- Restrict PostgreSQL to the internal Docker network — never expose port 5432 publicly.
- Enable PostgreSQL SSL in the connection string for added security:
  ```
  DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/dbname?ssl=require
  ```

---

## 6. Database Backups

Set up a cron job to back up PostgreSQL regularly:

```bash
# /etc/cron.d/autonomous-backup
0 2 * * * root docker exec autonomous-db pg_dump -U autonomous_user autonomous_db \
  | gzip > /backups/autonomous_$(date +\%Y\%m\%d).sql.gz
```

To restore from a backup:

```bash
gunzip -c /backups/autonomous_YYYYMMDD.sql.gz \
  | docker exec -i autonomous-db psql -U autonomous_user autonomous_db
```

---

## 7. Updating the Platform

```bash
# Pull latest code
git pull origin main

# Rebuild and restart containers (zero-downtime approach)
docker-compose up -d --build --no-deps backend frontend

# Verify the new version is running
curl http://localhost:8000/api/health
```

Database migrations are applied automatically on backend startup via Alembic. No manual migration step is required during updates.

---

## 8. Monitoring & Logs

```bash
# Stream logs from all services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend (Nginx) only
docker-compose logs -f frontend

# Database only
docker-compose logs -f db
```

For production monitoring, consider integrating:
- **Prometheus + Grafana** for metrics collection and dashboards
- **Loki** for centralized log aggregation
- **Uptime Kuma** or **Healthchecks.io** for uptime alerting

---

## 9. Stopping and Removing the Stack

```bash
# Stop services (preserves data volumes)
docker-compose down

# Stop services AND remove all data volumes (destructive — deletes the database)
docker-compose down -v
```
