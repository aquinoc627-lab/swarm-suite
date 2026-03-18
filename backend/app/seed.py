"""Seed database with initial demo data."""

import asyncio
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import async_session_maker, create_tables
from app.core.security import hash_password
from app.models.agent import Agent
from app.models.banter import Banter
from app.models.finding import Finding, FindingSeverity, FindingStatus
from app.models.mission import AgentMission, Mission
from app.models.scan import Scan, ScanStatus
from app.models.user import User


async def seed():
    await create_tables()
    async with async_session_maker() as db:
        # ── Users ──────────────────────────────────────────────────────────────
        result = await db.execute(select(User).where(User.username == "admin"))
        if not result.scalar_one_or_none():
            admin = User(
                username="admin",
                email="admin@swarm.local",
                hashed_password=hash_password("admin123"),
                role="admin",
            )
            db.add(admin)

        result = await db.execute(select(User).where(User.username == "operator"))
        if not result.scalar_one_or_none():
            operator = User(
                username="operator",
                email="operator@swarm.local",
                hashed_password=hash_password("operator123"),
                role="operator",
            )
            db.add(operator)

        await db.commit()

        result = await db.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one()

        # ── Agents ─────────────────────────────────────────────────────────────
        agents_data = [
            {
                "name": "Ghost",
                "codename": "GHOST-1",
                "status": "online",
                "persona": {"tone": "cold", "specialty": "stealth recon", "catchphrase": "I was never here."},
                "capabilities": ["nmap", "whois", "dig", "subfinder", "theharvester"],
            },
            {
                "name": "Viper",
                "codename": "VIPER-2",
                "status": "idle",
                "persona": {"tone": "aggressive", "specialty": "exploitation", "catchphrase": "Strike fast, leave nothing."},
                "capabilities": ["sqlmap", "nikto", "gobuster", "xss_scanner", "metasploit"],
            },
            {
                "name": "Cipher",
                "codename": "CIPHER-3",
                "status": "busy",
                "persona": {"tone": "analytical", "specialty": "vuln assessment", "catchphrase": "Every system has a weakness."},
                "capabilities": ["openvas", "nessus", "cve_lookup", "testssl", "hydra"],
            },
        ]

        created_agents = []
        for adata in agents_data:
            result = await db.execute(select(Agent).where(Agent.codename == adata["codename"]))
            agent = result.scalar_one_or_none()
            if not agent:
                agent = Agent(**adata)
                db.add(agent)
                await db.flush()
            created_agents.append(agent)

        await db.commit()

        # ── Missions ───────────────────────────────────────────────────────────
        missions_data = [
            {
                "title": "Operation Dark Phoenix",
                "description": "Full-spectrum penetration test of the external perimeter for TechCorp Inc.",
                "status": "active",
                "priority": "critical",
                "target": "techcorp.example.com",
                "objectives": [
                    "Map external attack surface",
                    "Identify critical CVEs",
                    "Test web application layer",
                    "Document all findings",
                ],
            },
            {
                "title": "Operation Silent Storm",
                "description": "Red team exercise targeting internal network segment 10.10.0.0/16.",
                "status": "planned",
                "priority": "high",
                "target": "10.10.0.0/16",
                "objectives": [
                    "Discover live hosts",
                    "Enumerate open services",
                    "Identify lateral movement paths",
                ],
            },
        ]

        created_missions = []
        for mdata in missions_data:
            result = await db.execute(select(Mission).where(Mission.title == mdata["title"]))
            mission = result.scalar_one_or_none()
            if not mission:
                mission = Mission(**mdata)
                db.add(mission)
                await db.flush()
            created_missions.append(mission)

        await db.commit()

        # Assign agents to mission 1
        for agent in created_agents[:2]:
            result = await db.execute(
                select(AgentMission).where(
                    AgentMission.agent_id == agent.id,
                    AgentMission.mission_id == created_missions[0].id,
                )
            )
            if not result.scalar_one_or_none():
                db.add(AgentMission(agent_id=agent.id, mission_id=created_missions[0].id, role="operator"))

        await db.commit()

        # ── Scans ──────────────────────────────────────────────────────────────
        scans_data = [
            {
                "name": "External Port Scan",
                "tool_id": "nmap",
                "target": "techcorp.example.com",
                "parameters": {"ports": "1-10000"},
                "status": ScanStatus.completed,
                "mission_id": created_missions[0].id,
                "agent_id": created_agents[0].id,
                "raw_output": "22/tcp open ssh OpenSSH 7.9\n80/tcp open http Apache 2.4.41\n443/tcp open https nginx 1.14.0\n3306/tcp open mysql MySQL 5.7.33",
                "findings_count": 4,
                "severity_summary": {"critical": 0, "high": 0, "medium": 1, "low": 3, "info": 0},
            },
            {
                "name": "Web Vulnerability Scan",
                "tool_id": "nikto",
                "target": "http://techcorp.example.com",
                "parameters": {"port": 80},
                "status": ScanStatus.completed,
                "mission_id": created_missions[0].id,
                "agent_id": created_agents[1].id,
                "raw_output": "+ OSVDB-3268: /images/: Directory indexing found.\n+ Cookie PHPSESSID without httponly\n+ /admin/ found",
                "findings_count": 3,
                "severity_summary": {"critical": 0, "high": 1, "medium": 2, "low": 0, "info": 0},
            },
            {
                "name": "SQL Injection Test",
                "tool_id": "sqlmap",
                "target": "http://techcorp.example.com/search?q=test",
                "parameters": {"level": 3, "risk": 2},
                "status": ScanStatus.completed,
                "mission_id": created_missions[0].id,
                "agent_id": created_agents[1].id,
                "raw_output": "[+] GET parameter 'q' is vulnerable.\n[+] UNION query injection detected\n[+] Back-end DBMS: MySQL",
                "findings_count": 1,
                "severity_summary": {"critical": 1, "high": 0, "medium": 0, "low": 0, "info": 0},
            },
            {
                "name": "SSL/TLS Audit",
                "tool_id": "testssl",
                "target": "techcorp.example.com:443",
                "parameters": {},
                "status": ScanStatus.running,
                "mission_id": created_missions[0].id,
                "agent_id": created_agents[2].id,
                "findings_count": 0,
                "severity_summary": {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0},
            },
            {
                "name": "Internal Host Discovery",
                "tool_id": "ping_sweep",
                "target": "10.10.0.0/24",
                "parameters": {},
                "status": ScanStatus.queued,
                "mission_id": created_missions[1].id,
                "findings_count": 0,
                "severity_summary": {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0},
            },
        ]

        created_scans = []
        for sdata in scans_data:
            sdata_copy = dict(sdata)
            result = await db.execute(select(Scan).where(Scan.name == sdata_copy["name"]))
            scan = result.scalar_one_or_none()
            if not scan:
                scan = Scan(**{**sdata_copy, "launched_by": admin.id})
                db.add(scan)
                await db.flush()
            created_scans.append(scan)

        await db.commit()

        # ── Findings ───────────────────────────────────────────────────────────
        findings_data = [
            # nmap scan findings
            {"scan_id": created_scans[0].id, "title": "Open Port 22/tcp (ssh)", "description": "SSH port open.", "severity": FindingSeverity.low, "category": "Open Port", "target": "techcorp.example.com", "port": 22, "protocol": "tcp", "status": FindingStatus.open},
            {"scan_id": created_scans[0].id, "title": "Open Port 80/tcp (http)", "description": "HTTP port open.", "severity": FindingSeverity.low, "category": "Open Port", "target": "techcorp.example.com", "port": 80, "protocol": "tcp", "status": FindingStatus.open},
            {"scan_id": created_scans[0].id, "title": "Open Port 443/tcp (https)", "description": "HTTPS port open.", "severity": FindingSeverity.low, "category": "Open Port", "target": "techcorp.example.com", "port": 443, "protocol": "tcp", "status": FindingStatus.open},
            {"scan_id": created_scans[0].id, "title": "Exposed MySQL Port 3306", "description": "MySQL database port is externally accessible.", "severity": FindingSeverity.medium, "category": "Open Port", "target": "techcorp.example.com", "port": 3306, "protocol": "tcp", "remediation": "Restrict MySQL access to localhost or internal network only.", "status": FindingStatus.confirmed},
            # nikto scan findings
            {"scan_id": created_scans[1].id, "title": "Directory Indexing Enabled", "description": "Web server directory listing is enabled on /images/.", "severity": FindingSeverity.high, "category": "Web Misconfiguration", "target": "http://techcorp.example.com", "evidence": "OSVDB-3268: /images/: Directory indexing found.", "remediation": "Disable directory listing in web server config.", "status": FindingStatus.open},
            {"scan_id": created_scans[1].id, "title": "Missing HttpOnly Flag on Session Cookie", "description": "Session cookie PHPSESSID is set without the HttpOnly flag.", "severity": FindingSeverity.medium, "category": "Web Misconfiguration", "target": "http://techcorp.example.com", "remediation": "Set HttpOnly flag on all session cookies.", "status": FindingStatus.open},
            {"scan_id": created_scans[1].id, "title": "Admin Interface Exposed", "description": "An admin interface was found at /admin/.", "severity": FindingSeverity.medium, "category": "Information Disclosure", "target": "http://techcorp.example.com", "status": FindingStatus.open},
            # sqlmap finding
            {"scan_id": created_scans[2].id, "title": "SQL Injection in search parameter", "description": "The 'q' GET parameter is injectable via UNION query technique. Full database access may be possible.", "severity": FindingSeverity.critical, "category": "SQL Injection", "target": "http://techcorp.example.com/search", "evidence": "UNION query: NULL UNION ALL SELECT NULL,NULL,CONCAT(...)", "remediation": "Use parameterised queries. Never concatenate user input into SQL strings.", "status": FindingStatus.confirmed},
            # extra findings for variety
            {"scan_id": created_scans[0].id, "title": "Outdated OpenSSH Version", "description": "OpenSSH 7.9 has known vulnerabilities. Upgrade to latest version.", "severity": FindingSeverity.medium, "category": "Outdated Software", "target": "techcorp.example.com", "port": 22, "cve_id": "CVE-2023-38408", "status": FindingStatus.open},
            {"scan_id": created_scans[1].id, "title": "X-Frame-Options Header Missing", "description": "The X-Frame-Options header is not present, enabling clickjacking attacks.", "severity": FindingSeverity.medium, "category": "Web Misconfiguration", "target": "http://techcorp.example.com", "remediation": "Add 'X-Frame-Options: DENY' or 'SAMEORIGIN' header.", "status": FindingStatus.remediated},
            {"scan_id": created_scans[1].id, "title": "X-Content-Type-Options Missing", "description": "The X-Content-Type-Options header is not set.", "severity": FindingSeverity.low, "category": "Web Misconfiguration", "target": "http://techcorp.example.com", "remediation": "Add 'X-Content-Type-Options: nosniff' header.", "status": FindingStatus.false_positive},
        ]

        for fdata in findings_data:
            result = await db.execute(
                select(Finding).where(
                    Finding.scan_id == fdata["scan_id"],
                    Finding.title == fdata["title"],
                )
            )
            if not result.scalar_one_or_none():
                db.add(Finding(**fdata))

        # ── Banter ─────────────────────────────────────────────────────────────
        banter_messages = [
            {"content": "Initiating recon on techcorp.example.com...", "sender": "GHOST-1", "message_type": "status"},
            {"content": "Port scan complete. Found 4 open ports including MySQL on 3306 — rookie mistake.", "sender": "GHOST-1", "message_type": "result"},
            {"content": "Web scanner deployed. Nikto reports directory indexing on /images/ — nice.", "sender": "VIPER-2", "message_type": "result"},
            {"content": "SQL injection confirmed on search endpoint. Full DB access possible. Critical finding logged.", "sender": "VIPER-2", "message_type": "alert"},
            {"content": "Running SSL audit on port 443. Give me a moment...", "sender": "CIPHER-3", "message_type": "status"},
            {"content": "Operation Dark Phoenix reconnaissance phase — complete.", "sender": "system", "message_type": "status"},
        ]

        result = await db.execute(select(Banter))
        if not result.scalars().first():
            for bdata in banter_messages:
                db.add(Banter(**bdata))

        await db.commit()
        print("✓ Seed data loaded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
