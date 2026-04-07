# Autonomous Nexus: Cross-Platform Deployment Guide v2.0

The Autonomous Command Center is built on a decoupled architecture: a containerized FastAPI (Python) backend and a React/Three.js WebGL frontend. It can be deployed natively across desktop environments or hosted via cloud for mobile (iOS/Android) access.

---

## 1. Cloud Deployment (Recommended for iOS/Android Mobile Access)

To bypass Apple App Store and Google Play Store restrictions on penetration testing software, the recommended distribution method is a Progressive Web App (PWA) backed by cloud infrastructure.

### A. The Backend (Render, Railway, or AWS EC2)
1.  **Clone the Repository** to your server or connect your GitHub to your PaaS provider.
2.  **Environment Variables:** Create a `.env` file in the `/backend` directory containing:
    ```ini
    DATABASE_URL=postgresql://user:pass@host/dbname
    SECRET_KEY=your_secure_random_string
    STRIPE_API_KEY=sk_live_your_key
    GEMINI_API_KEY=your_google_gemini_key
    CORS_ORIGINS=https://your-frontend-domain.com
    ```
    *Note: The system defaults to SQLite for local MVP testing, but automatically supports PostgreSQL in production via SQLAlchemy.*
3.  **Startup Command:**
    ```bash
    pip install -r requirements.txt
    uvicorn app.main:app --host 0.0.0.0 --port 8001
    ```

### B. The Frontend (Vercel, Netlify, or AWS Amplify)
1.  Connect your GitHub repository to your frontend hosting provider.
2.  Set the Root Directory to `/autonomous-frontend`.
3.  **Environment Variables:**
    ```ini
    REACT_APP_BACKEND_URL=https://your-backend-domain.com
    ```
4.  **Build Command:** `yarn install && yarn build`

### C. Mobile Installation (PWA)
Once hosted, users can install the platform directly to their phones:
*   **iOS (Safari):** Navigate to the URL -> Tap the "Share" icon -> Select "Add to Home Screen".
*   **Android (Chrome):** Navigate to the URL -> Tap the three-dot menu -> Select "Install App".
The app will launch as a full-screen, native-feeling application (Zenith Mode).

---

## 2. Windows 11 & Linux Deployment (Local Desktop)

If you wish to run the entire stack locally to utilize local host networking tools (like Nmap or Metasploit) on your own hardware.

### Prerequisites
*   Windows Subsystem for Linux (WSL2) enabled (Windows only).
*   Docker Desktop (Windows) or Docker Engine (Linux).
*   Node.js v20+ and Yarn.

### Deployment Steps
1.  **Clone & Configure**:
    ```bash
    git clone <repository-url>
    cd autonomous-nexus
    ```
    Configure your `/backend/.env` file with your Gemini and Stripe keys.
2.  **Launch the Stack**:
    ```bash
    docker-compose up -d --build
    ```
    This will spin up the database, the backend, and the frontend on your local machine.
3.  **Native Desktop App (Electron Compilation):**
    If you want a clickable `.exe` (Windows), `.AppImage` (Linux), or `.dmg` (Mac) with the official logo:
    ```bash
    cd autonomous-frontend
    yarn install
    npm run electron:build
    ```
    The compiled native application will be generated in the `dist/` folder.

---

## 3. Security & CI/CD Considerations

*   **API Keys:** Ensure `GEMINI_API_KEY` is kept secret. The Gemini 2.5 Pro model handles the cognitive reasoning for the autonomous agents.
*   **Stripe Webhooks:** Ensure your backend URL is registered in your Stripe Developer Dashboard to receive `checkout.session.completed` events at `/api/billing/webhook/stripe`. This automatically upgrades user tiers (Operative, Commander, Nexus Prime).
*   **Headless CI/CD:** If integrating with GitHub Actions or Jenkins, operators must generate a Headless API Key from the "API Integrations" tab in the UI. Pass this key in the `X-API-Key` header for automated requests.
