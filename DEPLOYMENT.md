# theHIVE — Production Deployment Guide

This guide provides instructions for deploying the theHIVE in a production environment using Docker and Nginx.

## 1. Prerequisites
- Docker and Docker Compose installed on the target server.
- A domain name pointing to the server's IP address.
- SSL/TLS certificates (e.g., from Let's Encrypt).

## 2. Environment Configuration
Create a `.env` file in the root directory with the following variables:

```env
# Backend Configuration
SECRET_KEY=your-production-secret-key-here
CORS_ORIGINS=https://your-domain.com
DATABASE_URL=postgresql+asyncpg://theHIVE_user:theHIVE_password@db:5432/theHIVE_db
GEMINI_API_KEY=your-gemini-api-key-here

# Frontend Configuration
REACT_APP_API_URL=https://api.your-domain.com

# Database Configuration
POSTGRES_USER=theHIVE_user
POSTGRES_PASSWORD=theHIVE_password
POSTGRES_DB=theHIVE_db
```

## 3. Deployment Steps
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/aquinoc627-lab/theHIVE-suite.git
    cd theHIVE-suite
    ```

2.  **Build and Start the Containers**:
    ```bash
    docker-compose up -d --build
    ```

3.  **Verify the Deployment**:
    - Frontend: `https://your-domain.com`
    - Backend API: `https://api.your-domain.com/api/health`

## 4. Security Hardening
- **SSL/TLS**: Use a reverse proxy like Nginx or Traefik to handle SSL termination.
- **Firewall**: Restrict access to ports 8000 and 5432, only allowing traffic from the frontend container and trusted sources.
- **Database Backups**: Set up a cron job to perform regular PostgreSQL backups.

## 5. Monitoring & Logs
- View logs for all services: `docker-compose logs -f`
- Backend logs: `docker-compose logs -f backend`
- Frontend logs: `docker-compose logs -f frontend`
