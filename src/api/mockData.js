/**
 * AEGISX Sentinel Mock Data State & Simulated SOC Backend
 * Adheres strictly to the TEAM_CONTRACT.md schema specification.
 */

// Initial baseline sources prior to attack
export const INITIAL_SOURCES = [
  {
    id: 'src-iam',
    name: 'IAM',
    category: 'Identity Provider',
    status: 'VERIFIED',
    trustScore: 99,
    lastUpdated: new Date(Date.now() - 60000).toISOString(),
    telemetryRate: '180 events/sec',
    summary: 'Okta & AWS Cognito SSO telemetry synchronised and valid.'
  },
  {
    id: 'src-edr',
    name: 'EDR',
    category: 'Endpoint Detection',
    status: 'VERIFIED',
    trustScore: 96,
    lastUpdated: new Date(Date.now() - 45000).toISOString(),
    telemetryRate: '980 events/sec',
    summary: 'CrowdStrike Falcon sensor cluster active across all 450 hosts.'
  },
  {
    id: 'src-firewall',
    name: 'Firewall',
    category: 'Perimeter Defense',
    status: 'VERIFIED',
    trustScore: 92,
    lastUpdated: new Date(Date.now() - 30000).toISOString(),
    telemetryRate: '12,500 packets/sec',
    summary: 'Palo Alto Next-Gen stateful inspection running nominal.'
  },
  {
    id: 'src-server',
    name: 'Server',
    category: 'Compute Infrastructure',
    status: 'VERIFIED',
    trustScore: 95,
    lastUpdated: new Date(Date.now() - 25000).toISOString(),
    telemetryRate: '75 events/sec',
    summary: 'Linux auditd telemetry reporting normal kernel behavior.'
  },
  {
    id: 'src-database',
    name: 'Database',
    category: 'Data Persistence',
    status: 'VERIFIED',
    trustScore: 98,
    lastUpdated: new Date(Date.now() - 15000).toISOString(),
    telemetryRate: '42 queries/sec',
    summary: 'PostgreSQL primary & replica transaction logs verified.'
  }
];

// Baseline incident summary prior to simulation
export const INITIAL_INCIDENT = {
  incidentId: 'INC-2026-9040',
  incidentName: 'Baseline SOC Monitoring — No Active Threat',
  severity: 'LOW',
  detectionStatus: 'IDLE_MONITORING',
  threatScore: 12,
  affectedAssets: ['None (All nodes operating within SLA)'],
  phase: 'NOMINAL',
  startedAt: new Date(Date.now() - 3600000).toISOString()
};

// Post-simulation incident state
export const SIMULATED_INCIDENT = {
  incidentId: 'INC-2026-9042',
  incidentName: 'APT-29 Identity Compromise & Bulk DB Exfiltration',
  severity: 'CRITICAL',
  detectionStatus: 'ACTIVE_INVESTIGATION',
  threatScore: 87,
  affectedAssets: ['auth-srv-us-east-1', 'prod-db-replica-02', 'iam-admin-vault'],
  phase: 'CONTAINMENT_PENDING',
  startedAt: new Date(Date.now() - 1200000).toISOString()
};

// Post-simulation sources
export const SIMULATED_SOURCES = [
  {
    id: 'src-iam',
    name: 'IAM',
    category: 'Identity Provider',
    status: 'COMPROMISED',
    trustScore: 42,
    lastUpdated: new Date().toISOString(),
    telemetryRate: '340 events/sec',
    summary: 'MFA anomaly flagged. Rogue session token active in US-East VPC.'
  },
  {
    id: 'src-edr',
    name: 'EDR',
    category: 'Endpoint Detection',
    status: 'DEGRADED',
    trustScore: 74,
    lastUpdated: new Date().toISOString(),
    telemetryRate: '1,420 events/sec',
    summary: 'Unsigned library injection flagged on prod-db-replica-02.'
  },
  {
    id: 'src-firewall',
    name: 'Firewall',
    category: 'Perimeter Defense',
    status: 'DEGRADED',
    trustScore: 68,
    lastUpdated: new Date().toISOString(),
    telemetryRate: '18,400 packets/sec',
    summary: 'Egress burst detected to suspicious offshore ASN 14061.'
  },
  {
    id: 'src-server',
    name: 'Server',
    category: 'Compute Infrastructure',
    status: 'COMPROMISED',
    trustScore: 38,
    lastUpdated: new Date().toISOString(),
    telemetryRate: '115 events/sec',
    summary: 'Unauthorized root escalation and `/var/lib/postgresql` memory dump.'
  },
  {
    id: 'src-database',
    name: 'Database',
    category: 'Data Persistence',
    status: 'DEGRADED',
    trustScore: 55,
    lastUpdated: new Date().toISOString(),
    telemetryRate: '94 queries/sec',
    summary: 'High-volume table scan & socket pipe exfiltration attempted.'
  }
];

// Attack timeline events
export const SIMULATED_EVENTS = [
  {
    id: 'EVT-1001',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    relativeTime: '18m ago',
    source: 'IAM',
    severity: 'CRITICAL',
    description: 'Anomalous MFA bypass detected for admin_srv from unrecognized ASN 14061.',
    evidenceStatus: 'VERIFIED',
    rawHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    assetId: 'auth-srv-us-east-1'
  },
  {
    id: 'EVT-1002',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    relativeTime: '15m ago',
    source: 'IAM',
    severity: 'HIGH',
    description: 'Short-lived STS temporary credentials minted for role `svc_backup_admin` with elevated policy.',
    evidenceStatus: 'VERIFIED',
    rawHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    assetId: 'iam-admin-vault'
  },
  {
    id: 'EVT-1003',
    timestamp: new Date(Date.now() - 13 * 60000).toISOString(),
    relativeTime: '13m ago',
    source: 'EDR',
    severity: 'CRITICAL',
    description: 'Unsigned binary `libsystemd-patch.so` injected into PostgreSQL worker process 4192.',
    evidenceStatus: 'VERIFIED',
    rawHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    assetId: 'prod-db-replica-02'
  },
  {
    id: 'EVT-1004',
    timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
    relativeTime: '9m ago',
    source: 'Server',
    severity: 'HIGH',
    description: 'Auditd triggered high-frequency READ syscalls on customer table space directory.',
    evidenceStatus: 'VERIFIED',
    rawHash: '4d79c6b8c9e54a019b782c57a9163273e0a12e8b9f0d1a4e7c3b2a19f8e6d5c4',
    assetId: 'prod-db-replica-02'
  },
  {
    id: 'EVT-1005',
    timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    relativeTime: '6m ago',
    source: 'Firewall',
    severity: 'CRITICAL',
    description: 'Outbound encrypted TLS flow initiated on port 8443 to drop-server 185.220.101.5 (4.2 GB).',
    evidenceStatus: 'VERIFIED',
    rawHash: '9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    assetId: 'edge-gw-us-east'
  },
  {
    id: 'EVT-1006',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    relativeTime: '4m ago',
    source: 'Database',
    severity: 'HIGH',
    description: 'Unauthorized pg_dump pipeline interrupted; staging archive detected in /tmp directory.',
    evidenceStatus: 'PENDING',
    rawHash: '3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a',
    assetId: 'prod-db-replica-02'
  }
];

// Evidence verification records
export const SIMULATED_EVIDENCE = [
  {
    id: 'EVD-4091',
    source: 'EDR Agent #09 (CrowdStrike Sensor)',
    hashVerification: 'VALID',
    expectedHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    calculatedHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    signatureVerification: 'VALID',
    signerKeyId: 'ECDSA-P256-EDR-SECKEY-88',
    integrityResult: 'UNALTERED',
    verificationTimestamp: new Date(Date.now() - 7 * 60000).toISOString(),
    chainProof: 'merkle-root:0x49f1a0b3e'
  },
  {
    id: 'EVD-4092',
    source: 'IAM Okta Syslog Connector',
    hashVerification: 'VALID',
    expectedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    calculatedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    signatureVerification: 'VALID',
    signerKeyId: 'RSA-4096-IAM-SECKEY-02',
    integrityResult: 'UNALTERED',
    verificationTimestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    chainProof: 'merkle-root:0x49f1a0b3f'
  },
  {
    id: 'EVD-4093',
    source: 'Palo Alto Perimeter Gateway',
    hashVerification: 'VALID',
    expectedHash: '9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    calculatedHash: '9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    signatureVerification: 'VALID',
    signerKeyId: 'ECDSA-P256-FW-SECKEY-14',
    integrityResult: 'UNALTERED',
    verificationTimestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    chainProof: 'merkle-root:0x49f1a0b40'
  }
];

// Multi-agent investigation findings
export const SIMULATED_INVESTIGATION_FINDINGS = [
  {
    agentName: 'Identity Sentinel Agent',
    finding: 'Credential stuffing attack followed by privilege escalation using compromised token service account `svc_backup_admin`.',
    confidence: 0.94,
    supportingEventIds: ['EVT-1001', 'EVT-1002'],
    uncertaintyNotes: 'Origin IP mapped to commercial VPN exit node; geo-spoofing probable.',
    recommendation: 'Revoke active OAuth tokens and invalidate IAM session credentials immediately.'
  },
  {
    agentName: 'Network Recon Agent',
    finding: 'Outbound encrypted TLS traffic on non-standard port 8443 towards unknown external IP 185.220.101.5.',
    confidence: 0.89,
    supportingEventIds: ['EVT-1003', 'EVT-1005'],
    uncertaintyNotes: 'Packet payload inspection limited due to TLS 1.3 certificate pinning.',
    recommendation: 'Deploy egress DNS sinkhole and quarantine port 8443 on edge gateway.'
  },
  {
    agentName: 'Forensics & Integrity Agent',
    finding: 'Cryptographic signature on PostgreSQL audit log confirmed authentic; 4.2GB customer table egress underway.',
    confidence: 0.98,
    supportingEventIds: ['EVT-1004', 'EVT-1006'],
    uncertaintyNotes: 'Local log purge command was attempted by attacker but defeated by WORM storage policy.',
    recommendation: 'Isolate database read replica host and freeze replication pipeline.'
  }
];

// Initial containment action
export const INITIAL_CONTAINMENT_ACTION = {
  actionId: 'ACT-ISO-PROD-DB',
  actionName: 'Isolate Database Read Replica and Revoke IAM Session Credentials',
  status: 'PENDING',
  riskReduction: '85%',
  potentialImpact: 'Read traffic automatically reroutes to backup cluster. Expected read query latency increase < 45ms.',
  analystNote: 'Awaiting human authorization before enforcing network isolation.'
};

// Executed containment action
export const EXECUTED_CONTAINMENT_ACTION = {
  actionId: 'ACT-ISO-PROD-DB',
  actionName: 'Isolate Database Read Replica and Revoke IAM Session Credentials',
  status: 'EXECUTED',
  riskReduction: '85%',
  potentialImpact: 'Read queries redirected to backup cluster. Expected latency increase < 45ms.',
  executedAt: new Date().toISOString(),
  outcome: 'Network interface eth1 quarantined via OpenFlow rule. IAM token invalidated. Lateral movement blocked.',
  analystNote: 'Executed by Lead Security Analyst via AEGISX One-Click Containment.'
};

// Pre-canned voice queries and AI analyst responses
export const PRESET_VOICE_RESPONSES = {
  "What is the blast radius and which servers are affected?": {
    answer: "The blast radius is currently constrained to the US-East VPC: specifically `prod-db-replica-02` and `auth-srv-us-east-1`. The primary write cluster remains unaffected, but egress exfiltration is actively attempting cross-VPC traversal via hijacked IAM credentials. Isolating the replica node prevents lateral spread.",
    confidence: 0.96,
    suggestedActions: ["Quarantine Replica Node", "Revoke IAM Credentials", "Freeze Replication Pipeline"]
  },
  "Is the customer database corrupted or tampered with?": {
    answer: "Forensic integrity verification confirms zero cryptographic tampering on disk blocks (Merkle proof 0x49f1a0b40 verified). However, unencrypted read exfiltration of customer records was in progress before socket interruption. Integrity is intact; confidentiality requires immediate credential invalidation.",
    confidence: 0.98,
    suggestedActions: ["Review Audit Log Access", "Rotate DB Encryption Master Keys"]
  },
  "What is the recommended containment action?": {
    answer: "AEGISX Sentinel recommends Action ACT-ISO-PROD-DB: Isolate `prod-db-replica-02` at the edge firewall and revoke all STS tokens minted for `svc_backup_admin`. Estimated risk reduction is 85% with zero impact on production write operations.",
    confidence: 0.94,
    suggestedActions: ["Authorize Containment Action ACT-ISO-PROD-DB"]
  },
  "Summarize the active incident.": {
    answer: "Active incident INC-2026-9042 is an APT-29 identity-driven compromise targeting PostgreSQL customer tables. Attack progression began with MFA bypass on auth-srv-us-east-1, proceeded to STS credential elevation on iam-admin-vault, followed by memory injection of libsystemd-patch.so into PostgreSQL worker 4192, and attempted egress of 4.2 GB to 185.220.101.5:8443.",
    confidence: 0.95,
    suggestedActions: ["Review Attack Timeline", "Verify Cryptographic Evidence", "Authorize Containment ACT-ISO-PROD-DB"]
  },
  "Which events support this attack path?": {
    answer: "Six correlated events support this propagation chain: EVT-1001 (IAM MFA anomaly), EVT-1002 (STS privilege elevation), EVT-1003 (EDR process injection), EVT-1004 (Auditd table space reads), EVT-1005 (Firewall TLS egress flow), and EVT-1006 (Staged pg_dump archive in /tmp).",
    confidence: 0.97,
    suggestedActions: ["Inspect Events EVT-1001 through EVT-1006", "Review Forensics Lockbox"]
  },
  "Which evidence artifacts failed verification?": {
    answer: "Zero artifacts have failed verification (no cryptographic tampering detected). EVD-4091 (EDR binary SHA-256), EVD-4092 (IAM auth trace), and EVD-4093 (Firewall egress pcap) are all HSM-verified with valid digital signatures. Artifact EVT-1006 (staging archive) remains in PENDING status awaiting seal.",
    confidence: 0.99,
    suggestedActions: ["Verify Merkle Root 0x49f1a0b40", "Download Cryptographic Bundle"]
  },
  "What remains uncertain?": {
    answer: "Key uncertainties identified by AI Investigation Agents: (1) Origin IP ASN 14061 is routed through a commercial VPN exit node; adversary true physical location remains unconfirmed. (2) Outbound TLS payload on port 8443 utilized certificate pinning, preventing deep payload content inspection before connection severance.",
    confidence: 0.92,
    suggestedActions: ["Correlate Global Threat Intelligence Feeds", "Sinkhole Destination ASN"]
  }
};

// Immutable Audit Ledger Entries
export const INITIAL_AUDIT_LOG = [
  {
    blockHeight: 14092,
    timestamp: "2026-10-10T11:00:22Z",
    operator: "LEAD_SOC_ANALYST (HUMAN_AUTH)",
    action: "ENFORCE_QUARANTINE_VPC",
    target: "prod-db-replica-02 [10.0.4.18]",
    signatureHash: "0x89f2a71d84c311499b61d4a0f443b23577d2e0915f3a09b4317c2f08a1c9e802",
    verified: "VALID (ECDSA-P256)",
    merkleRoot: "0x49f1a0b40"
  },
  {
    blockHeight: 14091,
    timestamp: "2026-10-10T10:59:40Z",
    operator: "AEGISX_INTEGRITY_SENTINEL",
    action: "MERKLE_ROOT_CHECKPOINT",
    target: "EVD-4091, EVD-4092, EVD-4093",
    signatureHash: "0x49f1a0b40e7912d8a011832047ff12ea5092a718c399b12d54a22c198b1e42a9",
    verified: "VALID (HSM)",
    merkleRoot: "0x49f1a0b3f"
  },
  {
    blockHeight: 14090,
    timestamp: "2026-10-10T10:58:10Z",
    operator: "AUTONOMOUS_FIRST_RESPONDER",
    action: "ISOLATE_IAM_SERVICE_ROLE",
    target: "svc_backup_admin [iam-admin-vault]",
    signatureHash: "0x7b20914c6e99d140e11a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e",
    verified: "VALID (ECDSA-P256)",
    merkleRoot: "0x49f1a0b3e"
  },
  {
    blockHeight: 14089,
    timestamp: "2026-10-10T10:54:42Z",
    operator: "NETWORK_RECON_SENTINEL",
    action: "SINKHOLE_EXTERNAL_EGRESS",
    target: "185.220.101.5:8443 [edge-gw-us-east]",
    signatureHash: "0x19f8a32b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f",
    verified: "VALID (ECDSA-P256)",
    merkleRoot: "0x49f1a0b3d"
  },
  {
    blockHeight: 14088,
    timestamp: "2026-10-10T10:47:35Z",
    operator: "EDR_WATCHDOG_DAEMON",
    action: "CAPTURE_PROCESS_MEMORY_DUMP",
    target: "libsystemd-patch.so [PID 4192]",
    signatureHash: "0x6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b",
    verified: "VALID (ECDSA-P256)",
    merkleRoot: "0x49f1a0b3c"
  },
  {
    blockHeight: 14087,
    timestamp: "2026-10-10T10:42:18Z",
    operator: "IDENTITY_SENTINEL_DAEMON",
    action: "FLAG_ANOMALOUS_SESSION",
    target: "admin_srv [auth-srv-us-east-1]",
    signatureHash: "0x3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b",
    verified: "VALID (ECDSA-P256)",
    merkleRoot: "0x49f1a0b3b"
  },
  {
    blockHeight: 14086,
    timestamp: "2026-10-10T10:00:00Z",
    operator: "AEGISX_SYSTEM_KERNEL",
    action: "INITIALIZE_TAMPER_RESISTANT_CHAIN",
    target: "AEGISX-ROOT-GENESIS",
    signatureHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    verified: "GENESIS",
    merkleRoot: "0x000000000"
  }
];

// Active Quarantine & Microsegmentation Hosts
export const MOCK_CONTAINMENT_HOSTS = [
  {
    hostname: "prod-db-replica-02",
    ipAddress: "10.0.4.18",
    isolationStatus: "QUARANTINE_PENDING",
    reason: "Malicious libsystemd-patch.so injection; high-volume exfiltration attempt",
    agentUptime: "99.98% (42d)",
    os: "Ubuntu 22.04 LTS (x86_64)",
    zone: "US-East VPC / DB-Subnet",
    lastHeartbeat: "2s ago",
    actions: ["Quarantine Node", "Flush Sockets", "Dump Memory"]
  },
  {
    hostname: "auth-srv-us-east-1",
    ipAddress: "10.0.1.12",
    isolationStatus: "SUSPICIOUS_MONITORED",
    reason: "Anomalous MFA bypass from unrecognized ASN 14061",
    agentUptime: "99.95% (18d)",
    os: "Debian 12 (Kernel 6.1)",
    zone: "US-East VPC / Public-Subnet",
    lastHeartbeat: "5s ago",
    actions: ["Quarantine Node", "Revoke Tokens", "Dump Memory"]
  },
  {
    hostname: "iam-admin-vault",
    ipAddress: "10.0.2.5",
    isolationStatus: "CREDENTIALS_FROZEN",
    reason: "Elevated STS temporary role minted without ticket authorization",
    agentUptime: "100.0% (120d)",
    os: "Alpine Linux (HSM Vault)",
    zone: "US-East VPC / Secure-IAM",
    lastHeartbeat: "1s ago",
    actions: ["Freeze Vault", "Flush Sockets"]
  },
  {
    hostname: "edge-gw-us-east",
    ipAddress: "10.0.0.1",
    isolationStatus: "TRAFFIC_FILTERED",
    reason: "Outbound TLS flow on port 8443 throttled via egress policy",
    agentUptime: "99.99% (94d)",
    os: "Palo Alto PAN-OS 11.0",
    zone: "Edge Perimeter Gateway",
    lastHeartbeat: "3s ago",
    actions: ["Sinkhole Port 8443", "Flush Sockets"]
  },
  {
    hostname: "core-dmz-01",
    ipAddress: "10.0.3.4",
    isolationStatus: "CONNECTED_HEALTHY",
    reason: "Nominal telemetry; zero anomalous lateral packet signatures",
    agentUptime: "99.99% (180d)",
    os: "CentOS Stream 9",
    zone: "DMZ Routing Cluster",
    lastHeartbeat: "8s ago",
    actions: ["Quarantine Node", "Dump Memory"]
  },
  {
    hostname: "ws-fin-089",
    ipAddress: "10.0.8.89",
    isolationStatus: "ISOLATED",
    reason: "Initial adversary foothold; endpoint severed at 802.1X switch port",
    agentUptime: "99.91% (12d)",
    os: "Windows 11 Enterprise (23H2)",
    zone: "Corporate Workstation LAN",
    lastHeartbeat: "Disconnected (Severed)",
    actions: ["Release Isolation", "Dump Memory"]
  }
];

// All Incident Triage Operations
export const MOCK_INCIDENTS_LIST = [
  {
    incidentId: "INC-2026-9042",
    attackVector: "APT-29 Identity Compromise & Bulk DB Exfiltration",
    targetHost: "prod-db-replica-02",
    ipAddress: "10.0.4.18",
    severity: "CRITICAL",
    status: "CONTAINMENT_PENDING",
    detectedAt: "2026-10-10T10:42:15Z",
    eventsCount: 6,
    threatScore: 87,
    phase: "CONTAINMENT_PENDING"
  },
  {
    incidentId: "INC-2026-9041",
    attackVector: "Credential Stuffing via Commercial VPN Exit Node",
    targetHost: "auth-srv-us-east-1",
    ipAddress: "10.0.1.12",
    severity: "HIGH",
    status: "ACTIVE_TRIAGE",
    detectedAt: "2026-10-10T09:15:30Z",
    eventsCount: 4,
    threatScore: 64,
    phase: "TRIAGE"
  },
  {
    incidentId: "INC-2026-9039",
    attackVector: "Suspicious Outbound Encrypted Egress Flow",
    targetHost: "edge-gw-us-east",
    ipAddress: "10.0.0.1",
    severity: "HIGH",
    status: "RESOLVED_CONTAINED",
    detectedAt: "2026-10-09T23:40:11Z",
    eventsCount: 3,
    threatScore: 72,
    phase: "CONTAINED"
  },
  {
    incidentId: "INC-2026-9038",
    attackVector: "Kerberoasting Probe Against Active Directory Service Accounts",
    targetHost: "ad-dc-01",
    ipAddress: "10.0.2.1",
    severity: "MEDIUM",
    status: "RESOLVED_CLOSED",
    detectedAt: "2026-10-09T18:22:05Z",
    eventsCount: 2,
    threatScore: 45,
    phase: "CLOSED"
  },
  {
    incidentId: "INC-2026-9035",
    attackVector: "Port Scanning & Reconnaissance Activity on Bastion",
    targetHost: "bastion-us-west",
    ipAddress: "10.0.0.4",
    severity: "LOW",
    status: "RESOLVED_CLOSED",
    detectedAt: "2026-10-08T14:10:44Z",
    eventsCount: 1,
    threatScore: 20,
    phase: "CLOSED"
  }
];

// Full Cryptographic Forensic Artifacts Locker
export const MOCK_FORENSIC_ARTIFACTS = [
  {
    id: "EVD-4091",
    filename: "libsystemd-patch.so",
    fileSize: "1.4 MB",
    sha256: "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    sourceHost: "prod-db-replica-02",
    integrityStatus: "HSM Verified / VALID",
    signerKeyId: "ECDSA-P256-EDR-SECKEY-88",
    chainProof: "merkle-root:0x49f1a0b3e",
    verifiedAt: "2026-10-10T10:54:10Z"
  },
  {
    id: "EVD-4092",
    filename: "okta-auth-session-trace.json",
    fileSize: "84 KB",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    sourceHost: "auth-srv-us-east-1",
    integrityStatus: "HSM Verified / VALID",
    signerKeyId: "RSA-4096-IAM-SECKEY-02",
    chainProof: "merkle-root:0x49f1a0b3f",
    verifiedAt: "2026-10-10T10:55:02Z"
  },
  {
    id: "EVD-4093",
    filename: "paloalto-pcap-egress-8443.pcap",
    fileSize: "4.2 GB",
    sha256: "9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
    sourceHost: "edge-gw-us-east",
    integrityStatus: "HSM Verified / VALID",
    signerKeyId: "ECDSA-P256-FW-SECKEY-14",
    chainProof: "merkle-root:0x49f1a0b40",
    verifiedAt: "2026-10-10T10:57:48Z"
  },
  {
    id: "EVD-4094",
    filename: "sts-temp-credential-token.jwt",
    fileSize: "3.2 KB",
    sha256: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    sourceHost: "iam-admin-vault",
    integrityStatus: "HSM Verified / VALID",
    signerKeyId: "RSA-4096-STS-SIGNER-01",
    chainProof: "merkle-root:0x49f1a0b41",
    verifiedAt: "2026-10-10T10:45:10Z"
  },
  {
    id: "EVD-4095",
    filename: "linux-auditd-table-dump.log",
    fileSize: "12.8 MB",
    sha256: "4d79c6b8c9e54a019b782c57a9163273e0a12e8b9f0d1a4e7c3b2a19f8e6d5c4",
    sourceHost: "prod-db-replica-02",
    integrityStatus: "HSM Verified / VALID",
    signerKeyId: "ECDSA-P256-AUDITD-89",
    chainProof: "merkle-root:0x49f1a0b42",
    verifiedAt: "2026-10-10T10:51:24Z"
  },
  {
    id: "EVD-4096",
    filename: "tmp-pg-dump-staging.tar.gz",
    fileSize: "850 MB",
    sha256: "3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
    sourceHost: "prod-db-replica-02",
    integrityStatus: "UNVERIFIED / PENDING",
    signerKeyId: "Awaiting HSM Seal",
    chainProof: "pending-block-confirmation",
    verifiedAt: "2026-10-10T10:56:15Z"
  }
];
