# Autonomous — Advanced Operations Guide

This guide covers advanced platform features and operational workflows. For day-to-day usage, see the [User Guide](UserGuide.md).

---

## 1. Platform Navigation

### The Global Command Palette (Omnibar)
Press `Ctrl+K` (Windows/Linux) or `Cmd+K` (Mac) from anywhere in the dashboard to open the Global Command Palette. Type to instantly search for:
- **Pages** — "Missions", "Arsenal", "Lab", "Terminal", "Knowledge"
- **Agents** — jump to a specific agent's card
- **Actions** — trigger common tasks without navigating away

Press `Escape` or click outside to close the palette.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open Global Command Palette |
| `Escape` | Close palette / dismiss modals |

### Mobile Usage

On mobile browsers (iOS/Android):
- The navigation sidebar collapses into a hamburger menu at the top-left.
- The Omnibar is accessible via the search icon in the top bar.
- Pinch-to-zoom is supported in the 3D hologram views (Agent Lab, Autonomous View).
- Two-finger swipe rotates 3D hologram models.
- The bottom navigation bar (when visible) provides quick access to key sections.

---

## 2. Advanced AI Workflows

### A. Adaptive Mission Execution (Generative Dashboard)

When agents operate in **Autonomous Mode**, the dashboard dynamically adapts its layout based on the type of operation in progress:

- **Recon Operations**: Focuses the view on OSINT results and network scan outputs.
- **Web Audit**: Highlights banter messages containing HTTP response analysis.
- **OSINT Gathering**: Surfaces the Knowledge Graph to show newly discovered entity relationships.

Toggle Autonomous Mode from the Notification Center (bell icon) in the top bar.

### B. Target Intelligence (OSINT & Knowledge Graph)

Combine the OSINT module with the Knowledge Graph for deep target profiling:

1. Navigate to **OSINT** and enter a target domain or IP.
2. Review the structured intelligence report.
3. Navigate to **Knowledge Graph** — new nodes from the OSINT operation will appear, showing relationships between discovered entities.
4. Double-click any node to expand it and see connected intelligence.

### C. Agent-to-Agent Collaboration

Configure agents to collaborate on complex missions:

1. Create a **parent mission** (the high-level objective).
2. Break it into **sub-tasks** (child missions) via the Mission detail view.
3. Assign a "Commander" agent to the parent mission and specialist agents to sub-tasks.
4. Enable **Autonomous Mode** — the Commander agent will delegate sub-tasks and agents will report back to the Banter feed.
5. Monitor progress in the **Collaboration Graph** on the Autonomous View home screen.

---

## 3. Cybersecurity Operations

### Using the Tool Arsenal

The Tool Arsenal provides 44+ pre-configured cybersecurity tools across 10 categories:

| Category | Example Tools |
|----------|--------------|
| Recon | Nmap, Masscan, theHarvester |
| Web | SQLMap, Nikto, Gobuster |
| Exploitation | Metasploit Framework, Cobalt Strike |
| Passwords | Hydra, John the Ripper, Hashcat |
| OSINT | Maltego, Shodan, Recon-ng |
| Wireless | Aircrack-ng, Kismet |
| Network | Wireshark, Tcpdump, Netcat |
| Post-Exploitation | Mimikatz, BloodHound |
| Darknet | Tor routing utilities |
| AI Ops | AI-assisted analysis modules |

**Security gates**: Tools in the `danger` category require admin confirmation before execution. This cannot be bypassed by operators.

### Running Playbooks

Playbooks automate multi-step operations:

1. Navigate to **Playbooks** and click **New Playbook**.
2. Name the playbook and add steps — each step is a tool command or an agent action.
3. Save the playbook.
4. Click **Execute** and assign a target agent to run it.

Playbooks are ideal for standardizing recurring workflows like weekly reconnaissance sweeps or post-incident forensics.

### Live Terminal

The **Terminal** page provides a direct command interface within the platform's secure sandbox. Use it to:
- Test tool commands before assigning them to agents.
- Execute quick diagnostic scripts.
- Review real-time command output via `LiveTerminal`.

---

## 4. Memory Palace (Long-Term Vector Memory)

The Memory Palace stores agent experiences in a ChromaDB vector database, enabling semantic recall across missions.

### Searching Memory
Click the brain icon (🧠) in the top bar to open the Memory Search. Enter a natural language query such as:
- `"reconnaissance scans against 192.168.1.0"`
- `"Python code for port scanning"`
- `"agent Alpha mission report last week"`

Results are ranked by semantic similarity and include the source agent, mission context, and timestamp.

### How Memory is Populated
Memory records are automatically created when:
- An agent completes a mission and posts a summary to Banter.
- An agent executes a tool and reports the output.
- A user saves a note or code snippet from the Terminal.

---

## 5. DevOps Agent (Autonomous Coding)

The **Architect-Sigma** persona is optimized for coding and system design tasks.

### Capabilities
- **Secure Code Sandbox**: Execute Python scripts and shell commands in an isolated environment.
- **GitHub Integration**: Fetch repository contents, analyze code, and propose Pull Requests.
- **Code Diff Viewer**: The `CodeDiff` component displays proposed changes with a side-by-side diff view.
- **Live Terminal Output**: Stream real-time output from code execution to the Terminal page.

### Setting Up GitHub Integration
1. Create a GitHub Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens) with `repo` scope.
2. Add `GITHUB_TOKEN=<your-token>` to your `.env` file.
3. Restart the backend.
4. Assign a mission like "Analyze repository `owner/repo` and suggest improvements" to an Architect-Sigma agent.

---

## 6. Ghost Protocol (Isolated Lab Environments)

The Ghost Protocol feature allows the backend to spin up isolated Docker containers as lab environments for advanced agent operations.

> ⚠️ **Security Notice**: This feature requires the backend container to have access to the Docker socket (`/var/run/docker.sock`). This grants significant host-level privileges. Only deploy this in trusted environments and ensure only admin-role users can trigger Ghost Protocol operations.

### Using Ghost Protocol
1. Navigate to the API or use an admin-role agent to trigger a Ghost Protocol lab creation.
2. The backend will create an isolated Docker container with the specified environment.
3. Agents can execute operations within this isolated lab without affecting the host system.
4. Use the **Kill Switch** to immediately terminate all lab containers if needed.

---

## 7. Authentication Advanced Configuration

### Switching to OAuth

To use an external OIDC provider instead of local JWT:

1. Set `AUTH_MODE=oauth` in `.env`.
2. Configure the OAuth provider settings:
   ```env
   OAUTH_DOMAIN=your-tenant.auth0.com
   OAUTH_CLIENT_ID=your-client-id
   OAUTH_CLIENT_SECRET=your-client-secret
   OAUTH_AUDIENCE=https://api.autonomous.local
   OAUTH_ISSUER=https://your-tenant.auth0.com/
   ```
3. Restart the backend.

Users will now authenticate via the configured OIDC provider. Local password credentials are disabled in OAuth mode.

### API Key Authentication

For programmatic or service-to-service access:

1. Navigate to **API Keys** and generate a key.
2. Use the key as a Bearer token:
   ```bash
   curl -H "Authorization: Bearer <your-api-key>" http://localhost:8000/api/agents
   ```

API keys respect the same RBAC roles as session-based authentication.

---

## 8. System Controls (Admin Only)

### Autonomous Mode Control
- **Enable**: `POST /api/autonomous?enabled=true`
- **Disable**: `POST /api/autonomous?enabled=false`
- **Status**: `GET /api/autonomous`

### System Override
The **System Override** panel (accessible via `GET/POST /api/system`) provides emergency controls for admins, including the ability to forcibly stop all agent operations.

### Kill Switch
The Kill Switch component (`KillSwitch.jsx`) provides a one-click emergency stop for all autonomous operations. Access it from the admin controls in the dashboard. Use this when agents are behaving unexpectedly or when you need to halt all operations immediately.

---

*For foundational usage, see the [User Guide](UserGuide.md). For deployment, see [DEPLOYMENT.md](../DEPLOYMENT.md).*
