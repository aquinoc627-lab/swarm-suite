# Autonomous Nexus: Cross-Platform Deployment Guide

The Autonomous Command Center is built on a containerized FastAPI (Python) backend and a React/Three.js frontend. It can be deployed across desktop and mobile ecosystems.

---

## 1. Windows 11 Deployment

### Prerequisites
*   Windows Subsystem for Linux (WSL2) enabled.
*   Docker Desktop installed and configured to use the WSL2 backend.
*   Git and Node.js (for local frontend development).

### Deployment Steps
1.  **Clone & Configure**: 
    ```bash
    git clone <repository-url>
    cd autonomous
    cp .env.example .env
    ```
    *Add your Stripe keys and database credentials to `.env`.*
2.  **Build via Docker Compose**:
    Open PowerShell or WSL2 terminal:
    ```bash
    docker-compose up -d --build
    ```
3.  **Access**: Open Edge or Chrome and navigate to `http://localhost:3000`.
4.  **Desktop App (Electron)**: To package as a native `.exe`:
    ```bash
    cd autonomous-frontend
    npm run electron:build
    ```
    This generates a standalone Windows executable in the `dist/` folder.

---

## 2. Linux Systems (Ubuntu / Debian / Kali)

Linux is the native environment for the backend cybersecurity tools (Nmap, Metasploit).

### Prerequisites
*   Docker Engine and Docker Compose V2.
*   Nginx (optional, for reverse proxy and SSL).

### Deployment Steps
1.  **System Prep**:
    ```bash
    sudo apt update && sudo apt install docker.io docker-compose-v2
    ```
2.  **Launch Stack**:
    ```bash
    cd /opt/autonomous
    sudo docker compose up -d --build
    ```
3.  **Production Hardening**:
    *   Bind the frontend to `127.0.0.1:3000` and the backend to `127.0.0.1:8000`.
    *   Use Nginx to proxy traffic from port 443 (HTTPS) to the frontend, and `/api` requests to the backend.
    *   Ensure `/root/.nethunter` (or equivalent tool directories) are volume-mounted into the backend container for persistence.

---

## 3. iOS & Android (PWA / Mobile Deployment)

Due to Apple and Google's strict App Store policies regarding penetration testing tools, the recommended deployment for mobile devices is via a **Progressive Web App (PWA)** connected to a cloud-hosted backend.

### Cloud Backend Setup (AWS / DigitalOcean / Vercel)
1.  Deploy the Dockerized backend to a secure cloud VPS.
2.  Deploy the React frontend to Vercel, Netlify, or your own Nginx server, pointing `REACT_APP_API_URL` to your cloud backend's HTTPS endpoint.

### Android Installation (Chrome)
1.  Open Chrome on your Android device and navigate to your deployed frontend URL.
2.  Tap the **three-dot menu** in the top right.
3.  Tap **"Add to Home Screen"** or **"Install App"**.
4.  Autonomous Nexus will now appear in your app drawer as a full-screen native application, utilizing mobile gestures.

### iOS Installation (Safari)
1.  Open Safari on your iPhone/iPad and navigate to your deployed frontend URL.
2.  Tap the **Share** button (square with an arrow pointing up) at the bottom.
3.  Scroll down and tap **"Add to Home Screen"**.
4.  Launch the app from your home screen. The Zenith HUD mode will automatically hide the Safari address bar, providing an immersive, full-screen iOS experience.
