"""Tool registry for all offensive security tools in Swarm Suite."""

TOOLS: dict[str, dict] = {
    # ── Reconnaissance ────────────────────────────────────────────────────────
    "nmap": {
        "id": "nmap",
        "name": "Nmap Port Scan",
        "description": "Network exploration and security auditing. Discovers open ports and service versions.",
        "category": "Reconnaissance",
        "command_template": "nmap -sV -p {ports} {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target IP or hostname"},
            {"name": "ports", "type": "string", "required": False, "default": "1-1000", "description": "Port range (e.g. 1-1000, 80,443)"},
            {"name": "scan_type", "type": "string", "required": False, "default": "sV", "description": "Nmap scan type flag"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 30,
    },
    "whois": {
        "id": "whois",
        "name": "Whois Lookup",
        "description": "Query WHOIS databases for domain registration and ownership information.",
        "category": "Reconnaissance",
        "command_template": "whois {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Domain name or IP address"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 5,
    },
    "dig": {
        "id": "dig",
        "name": "DNS Enumeration",
        "description": "Perform DNS lookups to enumerate DNS records for a target domain.",
        "category": "Reconnaissance",
        "command_template": "dig {record_type} {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Domain name"},
            {"name": "record_type", "type": "string", "required": False, "default": "ANY", "description": "DNS record type (A, MX, NS, TXT, ANY)"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 5,
    },
    "subfinder": {
        "id": "subfinder",
        "name": "Subdomain Finder",
        "description": "Fast passive subdomain enumeration using multiple data sources.",
        "category": "Reconnaissance",
        "command_template": "subfinder -d {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Domain name"},
            {"name": "timeout", "type": "integer", "required": False, "default": 30, "description": "Timeout in seconds"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 30,
    },
    "theharvester": {
        "id": "theharvester",
        "name": "OSINT Harvester",
        "description": "Gather emails, subdomains, hosts, and open ports from public sources.",
        "category": "Reconnaissance",
        "command_template": "theHarvester -d {target} -b {sources}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Domain name"},
            {"name": "sources", "type": "string", "required": False, "default": "google,bing", "description": "Comma-separated data sources"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 60,
    },

    # ── Web Application ────────────────────────────────────────────────────────
    "nikto": {
        "id": "nikto",
        "name": "Nikto Web Scanner",
        "description": "Web server scanner that detects dangerous files, outdated software, and misconfigurations.",
        "category": "Web Application",
        "command_template": "nikto -h {target} -p {port}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target URL or IP"},
            {"name": "port", "type": "integer", "required": False, "default": 80, "description": "Target port"},
        ],
        "severity_level": "warning",
        "requires_confirmation": False,
        "estimated_duration": 120,
    },
    "sqlmap": {
        "id": "sqlmap",
        "name": "SQLMap SQL Injection",
        "description": "Automatic SQL injection and database takeover tool.",
        "category": "Web Application",
        "command_template": "sqlmap -u {target} --batch --level={level} --risk={risk}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target URL with parameter"},
            {"name": "level", "type": "integer", "required": False, "default": 1, "description": "Detection level (1-5)"},
            {"name": "risk", "type": "integer", "required": False, "default": 1, "description": "Risk level (1-3)"},
        ],
        "severity_level": "warning",
        "requires_confirmation": False,
        "estimated_duration": 180,
    },
    "gobuster": {
        "id": "gobuster",
        "name": "Directory Busting",
        "description": "URI and DNS subdomain brute-forcing tool.",
        "category": "Web Application",
        "command_template": "gobuster dir -u {target} -w {wordlist}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target URL"},
            {"name": "wordlist", "type": "string", "required": False, "default": "/usr/share/wordlists/dirb/common.txt", "description": "Path to wordlist"},
            {"name": "extensions", "type": "string", "required": False, "default": "php,html,txt", "description": "File extensions to search"},
        ],
        "severity_level": "warning",
        "requires_confirmation": False,
        "estimated_duration": 90,
    },
    "xss_scanner": {
        "id": "xss_scanner",
        "name": "XSS Scanner",
        "description": "Automated cross-site scripting vulnerability detection.",
        "category": "Web Application",
        "command_template": "xssstrike -u {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target URL"},
        ],
        "severity_level": "warning",
        "requires_confirmation": False,
        "estimated_duration": 60,
    },
    "testssl": {
        "id": "testssl",
        "name": "SSL/TLS Check",
        "description": "Test SSL/TLS protocols, ciphers, and certificate information.",
        "category": "Web Application",
        "command_template": "testssl.sh {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target hostname:port"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 45,
    },

    # ── Network ────────────────────────────────────────────────────────────────
    "arp_scan": {
        "id": "arp_scan",
        "name": "ARP Scan",
        "description": "Discover hosts on a local network using ARP requests.",
        "category": "Network",
        "command_template": "arp-scan {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "CIDR range (e.g. 192.168.1.0/24)"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 15,
    },
    "traceroute": {
        "id": "traceroute",
        "name": "Traceroute",
        "description": "Map the network path to a target host.",
        "category": "Network",
        "command_template": "traceroute {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target hostname or IP"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 10,
    },
    "ping_sweep": {
        "id": "ping_sweep",
        "name": "Ping Sweep",
        "description": "Identify live hosts in a network range using ICMP.",
        "category": "Network",
        "command_template": "fping -a -g {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "CIDR range (e.g. 10.0.0.0/24)"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 20,
    },
    "banner_grab": {
        "id": "banner_grab",
        "name": "Banner Grabbing",
        "description": "Retrieve service banners to identify software and versions.",
        "category": "Network",
        "command_template": "nc -zv {target} {port}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target hostname or IP"},
            {"name": "port", "type": "integer", "required": True, "description": "Target port"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 10,
    },

    # ── Vulnerability Assessment ───────────────────────────────────────────────
    "openvas": {
        "id": "openvas",
        "name": "OpenVAS Scanner",
        "description": "Full-featured vulnerability scanner with extensive CVE coverage (simulation mode).",
        "category": "Vulnerability Assessment",
        "command_template": "openvas-cli --target={target} --config={scan_config}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target IP or hostname"},
            {"name": "scan_config", "type": "string", "required": False, "default": "full", "description": "Scan configuration profile"},
        ],
        "severity_level": "warning",
        "requires_confirmation": False,
        "estimated_duration": 300,
    },
    "nessus": {
        "id": "nessus",
        "name": "Nessus Scanner",
        "description": "Comprehensive vulnerability assessment platform (simulation mode).",
        "category": "Vulnerability Assessment",
        "command_template": "nessuscli scan --target {target}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target IP or hostname"},
        ],
        "severity_level": "warning",
        "requires_confirmation": False,
        "estimated_duration": 240,
    },
    "cve_lookup": {
        "id": "cve_lookup",
        "name": "CVE Lookup",
        "description": "Search the NVD CVE database for known vulnerabilities.",
        "category": "Vulnerability Assessment",
        "command_template": "curl https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={keyword}",
        "parameters": [
            {"name": "keyword", "type": "string", "required": True, "description": "Search keyword (software name/version)"},
            {"name": "year", "type": "integer", "required": False, "default": 2024, "description": "Publication year filter"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 10,
    },

    # ── Exploitation ───────────────────────────────────────────────────────────
    "metasploit": {
        "id": "metasploit",
        "name": "Metasploit Framework",
        "description": "Advanced exploitation framework (simulation mode — no real exploits executed).",
        "category": "Exploitation",
        "command_template": "msfconsole -x 'use {module}; set RHOSTS {target}; set PAYLOAD {payload}; run'",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target IP"},
            {"name": "module", "type": "string", "required": True, "description": "Metasploit module path"},
            {"name": "payload", "type": "string", "required": False, "default": "generic/shell_reverse_tcp", "description": "Payload module"},
        ],
        "severity_level": "danger",
        "requires_confirmation": True,
        "estimated_duration": 60,
    },
    "hydra": {
        "id": "hydra",
        "name": "Hydra Brute Force",
        "description": "Network login cracker supporting many protocols (simulation mode).",
        "category": "Exploitation",
        "command_template": "hydra -L {username_list} -P {password_list} {target} {service}",
        "parameters": [
            {"name": "target", "type": "string", "required": True, "description": "Target IP or hostname"},
            {"name": "service", "type": "string", "required": True, "description": "Protocol (ssh, ftp, http)"},
            {"name": "username_list", "type": "string", "required": True, "description": "Path to username list"},
            {"name": "password_list", "type": "string", "required": True, "description": "Path to password list"},
        ],
        "severity_level": "danger",
        "requires_confirmation": True,
        "estimated_duration": 120,
    },

    # ── Wireless ───────────────────────────────────────────────────────────────
    "aircrack": {
        "id": "aircrack",
        "name": "Aircrack-ng",
        "description": "WiFi network security toolkit for WEP/WPA/WPA2 analysis (simulation mode).",
        "category": "Wireless",
        "command_template": "aircrack-ng -b {bssid} -i {interface} capture.cap",
        "parameters": [
            {"name": "interface", "type": "string", "required": True, "description": "Wireless interface (e.g. wlan0)"},
            {"name": "bssid", "type": "string", "required": True, "description": "Target BSSID (MAC address)"},
        ],
        "severity_level": "danger",
        "requires_confirmation": True,
        "estimated_duration": 180,
    },
    "wifi_scanner": {
        "id": "wifi_scanner",
        "name": "WiFi Scanner",
        "description": "Scan for nearby wireless networks and gather information (simulation mode).",
        "category": "Wireless",
        "command_template": "iwlist {interface} scanning",
        "parameters": [
            {"name": "interface", "type": "string", "required": True, "description": "Wireless interface (e.g. wlan0)"},
        ],
        "severity_level": "info",
        "requires_confirmation": False,
        "estimated_duration": 15,
    },
}


def get_all_tools() -> list[dict]:
    return list(TOOLS.values())


def get_tool(tool_id: str) -> dict | None:
    return TOOLS.get(tool_id)


def get_tools_by_category() -> dict[str, list[dict]]:
    result: dict[str, list[dict]] = {}
    for tool in TOOLS.values():
        cat = tool["category"]
        result.setdefault(cat, []).append(tool)
    return result
