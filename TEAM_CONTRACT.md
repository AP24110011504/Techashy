# AEGISX Sentinel — Engineering & Team Contract
**Hackathon Demo & System Integration Protocol**
**Version:** 1.0.0
**Project Lead:** Cybersecurity Operations & AI Systems
**Frontend Lead Role:** Single-Page React SOC Dashboard

---

## 1. Project Overview & Architecture
AEGISX Sentinel is an autonomous AI-powered cybersecurity first responder designed for Security Operations Centers (SOCs).
Its mission is to:
1. Detect attacks across heterogeneous telemetry sources (IAM, EDR, Firewalls, Cloud Servers, Databases).
2. Cryptographically verify the integrity of telemetry evidence using hash chains and digital signatures to prevent tampering.
3. Coordinate multi-agent AI investigations with specialized agent roles (Identity Sentinel, Network Recon, Forensics & Integrity).
4. Provide natural-language SOC query capabilities via voice/text ("Ask AEGISX").
5. Formulate human-in-the-loop containment decisions with rigorous blast-radius and impact analysis before execution.

---

## 2. API Schema Contract (Backend & Mock Adapter Protocol)

All frontend components communicate with the backend via the `/api` route prefix.
If the backend is offline, unreachable, or returns network failure, the frontend **MUST** automatically activate the **Explicit MOCK MODE Adapter** and display a prominent **`MOCK DATA`** badge in the header.

### Endpoint 1: `GET /api/status`
- **Purpose**: Real-time heartbeat and connection status of AEGISX Sentinel.
- **Request**: `GET /api/status` (No request body).
- **Response Schema (`200 OK`)**:
```json
{
  "status": "healthy",
  "version": "1.4.0",
  "timestamp": "2026-10-10T11:00:00Z",
  "service": "AEGISX Sentinel Core",
  "mode": "live",
  "connectedSources": 5,
  "systemLoad": 0.28,
  "activeIncidents": 1
}
```

### Endpoint 2: `POST /api/scenario/run`
- **Purpose**: Trigger an end-to-end simulated cyber-attack scenario for SOC evaluation and demo purposes.
- **Request Schema (`POST /api/scenario/run`)**:
```json
{
  "scenarioId": "attack-sim-apt29-db-breach",
  "intensity": "high"
}
```
- **Response Schema (`200 OK`)**:
```json
{
  "success": true,
  "simulationId": "SIM-8842-DELTA",
  "incidentId": "INC-2026-9042",
  "incidentName": "APT-29 Identity Compromise & Bulk DB Exfiltration",
  "severity": "CRITICAL",
  "threatScore": 87,
  "detectionStatus": "ACTIVE_INVESTIGATION",
  "phase": "CONTAINMENT_PENDING",
  "affectedAssets": ["auth-srv-us-east-1", "prod-db-replica-02", "iam-admin-vault"],
  "message": "Attack scenario successfully executed. 6 telemetry events recorded, 3 agent investigations completed.",
  "timestamp": "2026-10-10T11:00:15Z"
}
```

### Endpoint 3: `GET /api/events`
- **Purpose**: Fetch chronological timeline events representing the attack progression.
- **Request**: `GET /api/events?incidentId=INC-2026-9042`
- **Response Schema (`200 OK`)**:
```json
{
  "incidentId": "INC-2026-9042",
  "total": 6,
  "events": [
    {
      "id": "EVT-1001",
      "timestamp": "2026-10-10T10:42:15Z",
      "relativeTime": "18m ago",
      "source": "IAM",
      "severity": "CRITICAL",
      "description": "Anomalous multi-factor authentication bypass detected for admin_srv account from unrecognized ASN 14061.",
      "evidenceStatus": "VERIFIED",
      "rawHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "assetId": "auth-srv-us-east-1"
    },
    {
      "id": "EVT-1002",
      "timestamp": "2026-10-10T10:45:02Z",
      "relativeTime": "15m ago",
      "source": "IAM",
      "severity": "HIGH",
      "description": "Short-lived STS temporary credentials minted for role `svc_backup_admin` with elevated cross-account assume-role policy.",
      "evidenceStatus": "VERIFIED",
      "rawHash": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
      "assetId": "iam-admin-vault"
    },
    {
      "id": "EVT-1003",
      "timestamp": "2026-10-10T10:47:33Z",
      "relativeTime": "13m ago",
      "source": "EDR",
      "severity": "CRITICAL",
      "description": "Unsigned binary `libsystemd-patch.so` injected into PostgreSQL worker process 4192 on host prod-db-replica-02.",
      "evidenceStatus": "VERIFIED",
      "rawHash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      "assetId": "prod-db-replica-02"
    },
    {
      "id": "EVT-1004",
      "timestamp": "2026-10-10T10:51:19Z",
      "relativeTime": "9m ago",
      "source": "Server",
      "severity": "HIGH",
      "description": "Auditd triggered high-frequency READ syscalls on customer table space `/var/lib/postgresql/15/main/base/16384`.",
      "evidenceStatus": "VERIFIED",
      "rawHash": "4d79c6b8c9e54a019b782c57a9163273e0a12e8b9f0d1a4e7c3b2a19f8e6d5c4",
      "assetId": "prod-db-replica-02"
    },
    {
      "id": "EVT-1005",
      "timestamp": "2026-10-10T10:54:40Z",
      "relativeTime": "6m ago",
      "source": "Firewall",
      "severity": "CRITICAL",
      "description": "Outbound encrypted TLS flow initiated on destination port 8443 to external drop-server `185.220.101.5` (Volume: 4.2 GB).",
      "evidenceStatus": "VERIFIED",
      "rawHash": "9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
      "assetId": "edge-gw-us-east"
    },
    {
      "id": "EVT-1006",
      "timestamp": "2026-10-10T10:56:11Z",
      "relativeTime": "4m ago",
      "source": "Database",
      "severity": "HIGH",
      "description": "Unauthorized pg_dump pipeline terminated unexpectedly after socket closure; staging archive detected in /tmp.",
      "evidenceStatus": "PENDING",
      "rawHash": "3f2a1b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a",
      "assetId": "prod-db-replica-02"
    }
  ]
}
```

### Endpoint 4: `GET /api/sources`
- **Purpose**: Health, trust scores, and operational status of all telemetry providers.
- **Request**: `GET /api/sources`
- **Response Schema (`200 OK`)**:
```json
{
  "sources": [
    {
      "id": "src-iam",
      "name": "IAM",
      "category": "Identity Provider",
      "status": "COMPROMISED",
      "trustScore": 42,
      "lastUpdated": "2026-10-10T10:58:30Z",
      "telemetryRate": "240 events/sec",
      "summary": "MFA anomaly flagged. Rogue session token active in US-East."
    },
    {
      "id": "src-edr",
      "name": "EDR",
      "category": "Endpoint Detection",
      "status": "DEGRADED",
      "trustScore": 74,
      "lastUpdated": "2026-10-10T10:59:12Z",
      "telemetryRate": "1,120 events/sec",
      "summary": "Process injection flagged on prod-db-replica-02. Agent health verified."
    },
    {
      "id": "src-firewall",
      "name": "Firewall",
      "category": "Perimeter Defense",
      "status": "DEGRADED",
      "trustScore": 68,
      "lastUpdated": "2026-10-10T10:57:45Z",
      "telemetryRate": "15,400 packets/sec",
      "summary": "Egress burst detected to suspicious offshore ASN."
    },
    {
      "id": "src-server",
      "name": "Server",
      "category": "Host & Linux Auditd",
      "status": "COMPROMISED",
      "trustScore": 38,
      "lastUpdated": "2026-10-10T10:56:02Z",
      "telemetryRate": "88 events/sec",
      "summary": "Unauthorized root privilege elevation detected."
    },
    {
      "id": "src-database",
      "name": "Database",
      "category": "PostgreSQL Cluster",
      "status": "DEGRADED",
      "trustScore": 55,
      "lastUpdated": "2026-10-10T10:55:18Z",
      "telemetryRate": "34 queries/sec",
      "summary": "High-volume read export attempted on customer table."
    }
  ]
}
```

### Endpoint 5: `GET /api/evidence`
- **Purpose**: Cryptographic audit and evidence integrity validation log.
- **Request**: `GET /api/evidence?incidentId=INC-2026-9042`
- **Response Schema (`200 OK`)**:
```json
{
  "incidentId": "INC-2026-9042",
  "chainValid": true,
  "immutableAuditHeight": 14092,
  "verifiedTimestamp": "2026-10-10T10:59:40Z",
  "evidenceRecords": [
    {
      "id": "EVD-4091",
      "source": "EDR Agent #09",
      "hashVerification": "VALID",
      "expectedHash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      "calculatedHash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      "signatureVerification": "VALID",
      "signerKeyId": "ECDSA-P256-EDR-SECKEY-88",
      "integrityResult": "UNALTERED",
      "verificationTimestamp": "2026-10-10T10:54:10Z",
      "chainProof": "merkle-root:0x49f1a0b3e"
    },
    {
      "id": "EVD-4092",
      "source": "IAM Okta Connector",
      "hashVerification": "VALID",
      "expectedHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "calculatedHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "signatureVerification": "VALID",
      "signerKeyId": "RSA-4096-IAM-SECKEY-02",
      "integrityResult": "UNALTERED",
      "verificationTimestamp": "2026-10-10T10:55:02Z",
      "chainProof": "merkle-root:0x49f1a0b3f"
    },
    {
      "id": "EVD-4093",
      "source": "Palo Alto Firewall Syslog",
      "hashVerification": "VALID",
      "expectedHash": "9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
      "calculatedHash": "9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c",
      "signatureVerification": "VALID",
      "signerKeyId": "ECDSA-P256-FW-SECKEY-14",
      "integrityResult": "UNALTERED",
      "verificationTimestamp": "2026-10-10T10:57:48Z",
      "chainProof": "merkle-root:0x49f1a0b40"
    }
  ]
}
```

### Endpoint 6: `POST /api/investigate`
- **Purpose**: Run or retrieve multi-agent SOC investigation findings.
- **Request Schema (`POST /api/investigate`)**:
```json
{
  "incidentId": "INC-2026-9042",
  "scope": "full"
}
```
- **Response Schema (`200 OK`)**:
```json
{
  "incidentId": "INC-2026-9042",
  "analyzedAt": "2026-10-10T10:58:05Z",
  "consensusConfidence": 0.93,
  "findings": [
    {
      "agentName": "Identity Sentinel Agent",
      "finding": "Credential stuffing followed by privilege escalation using compromised token service account `svc_backup_admin`.",
      "confidence": 0.94,
      "supportingEventIds": ["EVT-1001", "EVT-1002"],
      "uncertaintyNotes": "Origin IP mapped to commercial VPN exit node; geo-spoofing probable.",
      "recommendation": "Revoke active OAuth tokens and invalidate IAM session credentials immediately."
    },
    {
      "agentName": "Network Recon Agent",
      "finding": "Outbound encrypted TLS traffic on non-standard port 8443 towards unknown external IP 185.220.101.5.",
      "confidence": 0.89,
      "supportingEventIds": ["EVT-1003", "EVT-1005"],
      "uncertaintyNotes": "Packet inspection limited due to end-to-end encryption certificate pinning.",
      "recommendation": "Deploy egress DNS sinkhole and quarantine port 8443 on edge gateway."
    },
    {
      "agentName": "Forensics & Integrity Agent",
      "finding": "Cryptographic signature on PostgreSQL dump audit log confirmed authentic; 4.2GB customer table egress underway.",
      "confidence": 0.98,
      "supportingEventIds": ["EVT-1004", "EVT-1006"],
      "uncertaintyNotes": "File deletion routine attempted on local syslog but prevented by WORM storage policy.",
      "recommendation": "Isolate database read replica host and freeze replication pipeline."
    }
  ]
}
```

### Endpoint 7: `POST /api/voice/query`
- **Purpose**: Natural-language cybersecurity investigation assistant queries ("Ask AEGISX").
- **Request Schema (`POST /api/voice/query`)**:
```json
{
  "query": "What is the blast radius and which servers are affected?",
  "contextIncidentId": "INC-2026-9042"
}
```
- **Response Schema (`200 OK`)**:
```json
{
  "query": "What is the blast radius and which servers are affected?",
  "answer": "The blast radius is currently constrained to the US-East VPC: prod-db-replica-02 and auth-srv-us-east-1. The primary database cluster remains unbreached, but egress exfiltration is actively attempting cross-VPC traversal via IAM service credentials. Recommended containment will prevent lateral spread with zero expected customer downtime.",
  "confidence": 0.96,
  "suggestedActions": [
    "Quarantine Replica Node",
    "Revoke IAM Credentials",
    "Freeze Replication Pipeline"
  ],
  "timestamp": "2026-10-10T10:59:45Z"
}
```

### Endpoint 8: `POST /api/actions/approve`
- **Purpose**: Human-in-the-loop approval or rejection of containment action.
- **Request Schema (`POST /api/actions/approve`)**:
```json
{
  "actionId": "ACT-ISO-PROD-DB",
  "decision": "APPROVED",
  "analystNote": "Approved containment under SOC SOP-402 by Lead Analyst."
}
```
- **Response Schema (`200 OK`)**:
```json
{
  "success": true,
  "actionId": "ACT-ISO-PROD-DB",
  "actionName": "Isolate Database Read Replica and Revoke IAM Session",
  "status": "EXECUTED",
  "riskReduction": "85%",
  "potentialImpact": "Read queries redirected to backup cluster. Expected latency increase < 45ms.",
  "executedAt": "2026-10-10T11:00:22Z",
  "outcome": "Network interface eth1 quarantined. Service token revoked. Egress traffic dropped to 0 KB/s."
}
```

---

## 3. Frontend Architecture & Design Standard
1. **Color System & Aesthetics**:
   - Background: `#131517`
   - Primary Card: `#1B1F24`
   - Secondary Surface: `#20252C`
   - Border: `#2B3139`
   - Primary Text: `#E8EAED`
   - Secondary Text: `#9AA3AF`
   - Accent: `#B7C7FF`
   - Muted Status: Emerald (Success), Amber (Warning), Rose (Critical), Slate (Offline).
2. **Zero Hardcoded Data**:
   - Initial state loads dynamically via API client.
   - If backend endpoints are reachable, real data is rendered.
   - If unreachable, the resilient Mock Mode Adapter activates with clear `MOCK DATA` indicators.
3. **No Flashy Hacker/Matrix UI**:
   - Crisp enterprise typography, high information density, clear visual status badges.
   - Inspired by CrowdStrike Falcon, Linear, and Datadog.
