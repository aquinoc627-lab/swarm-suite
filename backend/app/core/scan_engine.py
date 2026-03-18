"""Background scan execution engine with simulation mode."""

import asyncio
import random
import re
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.core.tool_registry import get_tool
from app.models.scan import Scan, ScanStatus
from app.models.finding import Finding, FindingSeverity, FindingStatus


# ── WebSocket broadcast helper ────────────────────────────────────────────────

async def broadcast_scan_event(event_type: str, data: dict) -> None:
    """Broadcast a scan-related event to all connected WebSocket clients."""
    try:
        from app.api.websocket import manager
        await manager.broadcast({"event": event_type, "data": data})
    except Exception:
        pass  # WebSocket failures should not block scan processing


# ── Simulated output generators ───────────────────────────────────────────────

def _sim_nmap(target: str, params: dict) -> str:
    ports = params.get("ports", "1-1000")
    open_ports = [
        ("22", "tcp", "open", "ssh", "OpenSSH 7.9"),
        ("80", "tcp", "open", "http", "Apache httpd 2.4.41"),
        ("443", "tcp", "open", "https", "nginx 1.14.0"),
        ("3306", "tcp", "open", "mysql", "MySQL 5.7.33"),
        ("8080", "tcp", "open", "http-proxy", "Squid http proxy 4.6"),
    ]
    sample = random.sample(open_ports, k=random.randint(2, len(open_ports)))
    lines = [
        f"Starting Nmap 7.94 at {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC",
        f"Nmap scan report for {target}",
        f"Host is up (0.00{random.randint(10,99)}s latency).",
        f"Scanned ports: {ports}",
        "",
        "PORT      STATE  SERVICE         VERSION",
    ]
    for port, proto, state, svc, version in sample:
        lines.append(f"{port}/{proto}    {state}   {svc:<15} {version}")
    lines += ["", f"Nmap done: 1 IP address (1 host up) scanned in {random.uniform(3, 15):.2f} seconds"]
    return "\n".join(lines)


def _sim_nikto(target: str, params: dict) -> str:
    findings = [
        "- Nikto v2.1.6",
        f"+ Target IP:          {target}",
        "+ Target Hostname:    " + target,
        f"+ Target Port:        {params.get('port', 80)}",
        "+ Server: Apache/2.4.41 (Ubuntu)",
        "+ The anti-clickjacking X-Frame-Options header is not present.",
        "+ The X-Content-Type-Options header is not set. This could allow the user agent to render content in a different MIME type.",
        "+ Retrieved x-powered-by header: PHP/7.2.24-0ubuntu0.18.04.6",
        "+ OSVDB-3092: /admin/: This might be interesting...",
        "+ OSVDB-3268: /images/: Directory indexing found.",
        "+ Cookie PHPSESSID created without the httponly flag",
        "+ /login.php: Admin login page/section found.",
        "+ OSVDB-3092: /backup/: Backup directory found.",
        "+ 7 item(s) reported on remote host",
    ]
    return "\n".join(findings)


def _sim_sqlmap(target: str, params: dict) -> str:
    return "\n".join([
        f"        ___",
        "       __H__",
        " ___ ___[.]_____ ___ ___  {1.7.8#stable}",
        f"[*] starting @ {datetime.now(timezone.utc).strftime('%H:%M:%S')} /2024-01-15/",
        "",
        f"[+] testing connection to the target URL '{target}'",
        "[+] testing if the target URL content is stable",
        "[+] target URL content is stable",
        "[+] testing if GET parameter 'id' is dynamic",
        "[+] GET parameter 'id' appears to be dynamic",
        "[+] heuristic (basic) test shows that GET parameter 'id' might be injectable (possible DBMS: 'MySQL')",
        "[+] GET parameter 'id' is vulnerable. Do you want to keep testing the others (if any)? [y/N]",
        "",
        "[+] sqlmap identified the following injection point(s) with a total of 46 HTTP(s) requests:",
        "---",
        "Parameter: id (GET)",
        "    Type: boolean-based blind",
        "    Title: AND boolean-based blind - WHERE or HAVING clause",
        "    Payload: id=1 AND 3836=3836",
        "",
        "    Type: time-based blind",
        "    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)",
        "    Payload: id=1 AND SLEEP(5)",
        "",
        "    Type: UNION query",
        "    Title: Generic UNION query (NULL) - 3 columns",
        "    Payload: id=NULL UNION ALL SELECT NULL,NULL,CONCAT(0x716a767171,0x4d73494c42,0x71766b7871)-- -",
        "---",
        "[+] the back-end DBMS is MySQL",
        f"[*] ending @ {datetime.now(timezone.utc).strftime('%H:%M:%S')} /2024-01-15/",
    ])


def _sim_gobuster(target: str, params: dict) -> str:
    paths = [
        "/admin (Status: 200) [Size: 4321]",
        "/login (Status: 200) [Size: 2048]",
        "/backup (Status: 403) [Size: 287]",
        "/.git (Status: 403) [Size: 287]",
        "/config (Status: 403) [Size: 287]",
        "/api (Status: 200) [Size: 134]",
        "/uploads (Status: 200) [Size: 891]",
        "/robots.txt (Status: 200) [Size: 55]",
        "/sitemap.xml (Status: 200) [Size: 1234]",
    ]
    lines = [
        "===============================================================",
        "Gobuster v3.6",
        "===============================================================",
        f"[+] Url:                     {target}",
        "[+] Threads:                 10",
        f"[+] Wordlist:                {params.get('wordlist', '/usr/share/wordlists/dirb/common.txt')}",
        "[+] Status codes:            200,204,301,302,307,401,403",
        "===============================================================",
    ] + random.sample(paths, k=random.randint(4, len(paths))) + [
        "",
        "===============================================================",
        "Finished",
        "===============================================================",
    ]
    return "\n".join(lines)


def _sim_whois(target: str, params: dict) -> str:
    return "\n".join([
        f"Domain Name: {target.upper()}",
        "Registry Domain ID: 123456789_DOMAIN_COM-VRSN",
        "Registrar WHOIS Server: whois.registrar.com",
        "Registrar URL: http://www.registrar.com",
        "Updated Date: 2023-06-15T12:00:00Z",
        "Creation Date: 2010-03-20T08:00:00Z",
        "Registry Expiry Date: 2025-03-20T08:00:00Z",
        "Registrar: Example Registrar, LLC",
        "Registrant Organization: Example Corp",
        "Registrant Country: US",
        f"Name Server: ns1.{target}",
        f"Name Server: ns2.{target}",
        "DNSSEC: unsigned",
    ])


def _sim_testssl(target: str, params: dict) -> str:
    return "\n".join([
        f"Testing protocols via sockets except NPN+ALPN on {target}",
        "",
        " SSLv2      not offered (OK)",
        " SSLv3      not offered (OK)",
        " TLS 1      offered (deprecated)",
        " TLS 1.1    offered (deprecated)",
        " TLS 1.2    offered (OK)",
        " TLS 1.3    offered (OK): final",
        "",
        " Certificate: #1 / 1",
        f"  Subject:         CN={target}",
        "  Issuer:          Let's Encrypt Authority X3",
        "  Validity:        2024-01-01 00:00 UTC --> 2024-04-01 00:00 UTC",
        "  SHA1:            AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD",
        "",
        " BEAST, POODLE, CRIME, SWEET32 — not vulnerable (OK)",
        " Heartbleed:                    not vulnerable (OK)",
        " ROBOT:                         not vulnerable (OK)",
        " TLS 1.0 offered — consider disabling (WARN)",
        " TLS 1.1 offered — consider disabling (WARN)",
    ])


def _sim_generic(tool_id: str, target: str, params: dict) -> str:
    return (
        f"[{datetime.now(timezone.utc).isoformat()}] Running {tool_id} against {target}\n"
        f"Parameters: {params}\n"
        f"Scan completed. No critical issues found.\n"
        f"[DONE] {tool_id} finished in {random.uniform(1, 10):.1f}s"
    )


def generate_simulated_output(tool_id: str, target: str, parameters: dict) -> str:
    generators = {
        "nmap": _sim_nmap,
        "nikto": _sim_nikto,
        "sqlmap": _sim_sqlmap,
        "gobuster": _sim_gobuster,
        "whois": _sim_whois,
        "testssl": _sim_testssl,
    }
    gen = generators.get(tool_id)
    if gen:
        return gen(target, parameters)
    return _sim_generic(tool_id, target, parameters)


# ── Finding extraction ─────────────────────────────────────────────────────────

def extract_findings(tool_id: str, raw_output: str, scan_id: str, target: str) -> list[dict]:
    findings: list[dict] = []

    if tool_id == "nmap":
        for line in raw_output.splitlines():
            m = re.match(r"(\d+)/(\w+)\s+open\s+(\S+)\s*(.*)", line)
            if m:
                port, proto, svc, version = m.groups()
                severity = FindingSeverity.low.value
                if port in ("3306", "5432", "27017", "6379"):
                    severity = FindingSeverity.medium.value
                findings.append({
                    "scan_id": scan_id,
                    "title": f"Open Port {port}/{proto} ({svc})",
                    "description": f"Port {port}/{proto} is open running {svc} {version}",
                    "severity": severity,
                    "category": "Open Port",
                    "evidence": line.strip(),
                    "target": target,
                    "port": int(port),
                    "protocol": proto,
                })

    elif tool_id == "sqlmap":
        if "is vulnerable" in raw_output or "injection point" in raw_output:
            findings.append({
                "scan_id": scan_id,
                "title": "SQL Injection Vulnerability",
                "description": "The target URL is vulnerable to SQL injection. An attacker could read, modify, or delete database data.",
                "severity": FindingSeverity.critical.value,
                "category": "SQL Injection",
                "evidence": raw_output[:500],
                "remediation": "Use parameterised queries / prepared statements. Sanitise all user inputs.",
                "target": target,
            })

    elif tool_id == "nikto":
        for line in raw_output.splitlines():
            if line.startswith("+ ") and ("OSVDB" in line or "found" in line.lower() or "not set" in line.lower()):
                severity = FindingSeverity.medium.value
                if "indexing" in line.lower() or "backup" in line.lower():
                    severity = FindingSeverity.high.value
                findings.append({
                    "scan_id": scan_id,
                    "title": line[2:60].strip(),
                    "description": line[2:].strip(),
                    "severity": severity,
                    "category": "Web Misconfiguration",
                    "evidence": line.strip(),
                    "target": target,
                })

    elif tool_id == "gobuster":
        for line in raw_output.splitlines():
            if "(Status: 200)" in line and ("/admin" in line or "/backup" in line or "/.git" in line):
                findings.append({
                    "scan_id": scan_id,
                    "title": f"Sensitive Directory Exposed: {line.split()[0]}",
                    "description": f"Publicly accessible sensitive directory found: {line}",
                    "severity": FindingSeverity.high.value,
                    "category": "Information Disclosure",
                    "evidence": line.strip(),
                    "target": target,
                })

    elif tool_id == "testssl":
        if "TLS 1.0 offered" in raw_output:
            findings.append({
                "scan_id": scan_id,
                "title": "Deprecated TLS 1.0 Protocol Supported",
                "description": "TLS 1.0 is deprecated and considered insecure.",
                "severity": FindingSeverity.medium.value,
                "category": "SSL/TLS Misconfiguration",
                "evidence": "TLS 1.0 offered",
                "remediation": "Disable TLS 1.0 and TLS 1.1 on the server.",
                "target": target,
            })
        if "TLS 1.1 offered" in raw_output:
            findings.append({
                "scan_id": scan_id,
                "title": "Deprecated TLS 1.1 Protocol Supported",
                "description": "TLS 1.1 is deprecated and considered insecure.",
                "severity": FindingSeverity.medium.value,
                "category": "SSL/TLS Misconfiguration",
                "evidence": "TLS 1.1 offered",
                "remediation": "Disable TLS 1.0 and TLS 1.1 on the server.",
                "target": target,
            })

    elif tool_id == "xss_scanner":
        findings.append({
            "scan_id": scan_id,
            "title": "Cross-Site Scripting (XSS) Vulnerability",
            "description": "A reflected XSS vulnerability was detected in the target application.",
            "severity": FindingSeverity.high.value,
            "category": "XSS",
            "evidence": f"Payload reflected in response for target {target}",
            "remediation": "Encode all user-supplied output and implement Content-Security-Policy headers.",
            "target": target,
        })

    return findings


# ── Main scan processor ────────────────────────────────────────────────────────

async def process_scan(scan_id: str, db: AsyncSession | None = None) -> None:
    """Execute a scan and persist results. Called as a background task."""
    close_session = db is None
    if db is None:
        db = async_session_maker()

    try:
        result = await db.execute(select(Scan).where(Scan.id == scan_id))
        scan = result.scalar_one_or_none()
        if scan is None:
            return

        # Mark as running
        scan.status = ScanStatus.running
        scan.started_at = datetime.now(timezone.utc)
        await db.commit()
        await broadcast_scan_event("scan_started", {"scan_id": scan_id, "tool_id": scan.tool_id})

        # Simulate processing delay
        tool = get_tool(scan.tool_id)
        duration = tool.get("estimated_duration", 5) if tool else 5
        await asyncio.sleep(min(duration * 0.05, 3))  # cap sim delay at 3 s

        # Broadcast progress
        await broadcast_scan_event("scan_progress", {"scan_id": scan_id, "percent": 50})

        # Generate output
        raw_output = generate_simulated_output(scan.tool_id, scan.target, scan.parameters or {})

        # Extract findings
        raw_findings = extract_findings(scan.tool_id, raw_output, scan_id, scan.target)

        # Persist findings
        severity_summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for fd in raw_findings:
            finding = Finding(
                scan_id=scan_id,
                title=fd["title"],
                description=fd.get("description", ""),
                severity=fd["severity"],
                category=fd.get("category", "General"),
                evidence=fd.get("evidence"),
                remediation=fd.get("remediation"),
                target=fd.get("target", scan.target),
                port=fd.get("port"),
                protocol=fd.get("protocol"),
                cve_id=fd.get("cve_id"),
                status=FindingStatus.open,
            )
            db.add(finding)
            sev = fd["severity"]
            if sev in severity_summary:
                severity_summary[sev] += 1
            await broadcast_scan_event("finding_created", {
                "scan_id": scan_id,
                "finding": {"title": fd["title"], "severity": fd["severity"]},
            })

        scan.status = ScanStatus.completed
        scan.raw_output = raw_output
        scan.completed_at = datetime.now(timezone.utc)
        scan.findings_count = len(raw_findings)
        scan.severity_summary = severity_summary
        scan.result = {"findings_count": len(raw_findings), "severity_summary": severity_summary}
        await db.commit()
        await broadcast_scan_event("scan_completed", {
            "scan_id": scan_id,
            "findings_count": len(raw_findings),
            "severity_summary": severity_summary,
        })

    except Exception as exc:
        try:
            result = await db.execute(select(Scan).where(Scan.id == scan_id))
            scan = result.scalar_one_or_none()
            if scan:
                scan.status = ScanStatus.failed
                scan.result = {"error": str(exc)}
                await db.commit()
            await broadcast_scan_event("scan_failed", {"scan_id": scan_id, "error": str(exc)})
        except Exception:
            pass
    finally:
        if close_session:
            await db.close()
