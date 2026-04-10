# Security Policy

## Supported Versions

The following versions of **Autonomous** are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| latest (main branch) | ✅ Yes |
| Previous releases     | ❌ No  |

> We recommend always running the latest version from the `main` branch. Older snapshots are not actively maintained.

---

## Reporting a Vulnerability

We take the security of the Autonomous platform seriously. If you discover a security vulnerability, we appreciate your help in disclosing it responsibly.

### How to Report

1. **Do NOT open a public GitHub issue.** Security vulnerabilities must be reported privately to avoid exposing users to risk.
2. **Email us at:** [security@autonomous-project.dev](mailto:security@autonomous-project.dev) *(replace with your actual contact address)*
3. Alternatively, use [GitHub Private Vulnerability Reporting](https://github.com/aquinoc627-lab/Autonomous/security/advisories/new) to submit a report directly through GitHub.

### What to Include

Please provide as much detail as possible:

- **Description** of the vulnerability
- **Steps to reproduce** the issue (proof of concept if available)
- **Affected component(s)** (e.g., backend API, frontend, Docker configuration, authentication, tool execution engine)
- **Impact assessment** — what an attacker could achieve
- **Suggested fix**, if you have one

### Response Timeline

| Action | Timeframe |
| ------ | --------- |
| Acknowledgment of report | Within **48 hours** |
| Initial triage and assessment | Within **5 business days** |
| Status update to reporter | Within **10 business days** |
| Patch release (critical issues) | Target **30 days** or sooner |

### After a Fix Is Released

- We will credit the reporter in the release notes (unless anonymity is requested).
- A GitHub Security Advisory will be published for significant vulnerabilities.

---

## Security Architecture & Best Practices

The Autonomous platform includes several security layers. Contributors and deployers should be aware of the following:

### Authentication & Authorization

- **JWT-based authentication** with role-based access control (`admin`, `operator`).
- Default demo credentials are provided for local development only. **You MUST change all default passwords before any network-accessible deployment.**
- The auth system is designed to be swappable with OAuth providers (Auth0, Okta, etc.) for production environments.

### API Security

- **Rate limiting** is enforced on API endpoints to prevent abuse.
- Security headers middleware is applied to all HTTP responses.
- Input validation is performed via **Pydantic schemas** on the FastAPI backend.

### Tool Execution Engine

- The platform manages a catalog of **44+ cybersecurity tools** (Nmap, Metasploit, etc.).
- All tool executions are gated by **security confirmation prompts** — no tool runs without explicit approval.
- OS-aware command generation ensures commands are appropriate for the host environment.
- **Sandboxed code execution** is used for the Autonomous Coding (DevOps Agent) feature.

### Data Security

- **Database**: PostgreSQL (production) / SQLite (development) with ORM-based access through SQLAlchemy to prevent SQL injection.
- **Vector Memory Store**: ChromaDB is used for agent long-term memory. Ensure access to `backend/data/` is restricted in production.
- **Environment Variables**: Sensitive configuration (API keys, tokens, database URLs) must be set via environment variables and never committed to the repository. See `.env.example` for the full list.

### Deployment

- **Docker Compose** is the recommended deployment method with isolated service containers.
- Container images should be kept up to date and scanned for known vulnerabilities.
- The `scripts/security_audit.sh` script is available for automated security scanning.
- **Web commit sign-off** is required for contributions to this repository.

### Frontend Security

- React frontend served via **Nginx** in production builds.
- Standard browser security practices apply (CSP headers, XSS prevention, HTTPS in production).

---

## Scope

The following are **in scope** for security reports:

- Backend API (FastAPI) vulnerabilities
- Authentication/authorization bypasses
- SQL injection, XSS, CSRF, SSRF, or other OWASP Top 10 issues
- Insecure default configurations
- Tool execution engine escapes or privilege escalation
- Sandbox escapes in the DevOps Agent code execution feature
- Docker container breakouts or misconfigurations
- Sensitive data exposure (API keys, tokens, credentials in code or logs)
- Dependency vulnerabilities in Python (`requirements.txt`) or JavaScript (`package.json`) packages

The following are **out of scope**:

- Vulnerabilities in third-party services (Google Gemini API, GitHub API) themselves
- Social engineering attacks
- Denial of service via volumetric attacks (network-level DDoS)
- Issues requiring physical access to the host machine
- Findings from automated scanners without a demonstrated proof of concept

---

## Security Updates

Security patches and updates will be communicated through:

- **GitHub Security Advisories** on this repository
- **Release notes** accompanying patched versions
- Direct notification to the reporter

---

## Acknowledgments

We gratefully thank all security researchers who help keep Autonomous and its users safe. Responsible disclosure is valued and will be recognized.

---

*This policy was last updated on 2026-04-10.*