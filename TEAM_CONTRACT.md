# AEGISX Sentinel — Team Contract & Component Integration Architecture
**Techashy 2.0 Hackathon Project (IIIT Kottayam)**  
**Version:** 1.0.0  
**Status:** ACTIVE  

---

## 1. Component Ownership & Team Responsibilities

| Component | Lead / Owner | Module Path | Primary Deliverables |
| :--- | :--- | :--- | :--- |
| **Backend & Integration** | Team Lead | `sentinel/api/`, `sentinel/storage/` | FastAPI REST API, SQLite database, lifecycle, error handling |
| **Detection Engine** | Sathwika Kaswa | `detection/detector.py` | Deterministic local threat detection rules (burst logins, DB activity, EDR heartbeat) |
| **Evidence Engine** | Cryptographic Lead | `sentinel/crypto/` | Canonical SHA-256 hashing, HMAC-SHA256 signatures, chained ledger verification |
| **AI Multi-Agent System** | AI Agent Lead | `sentinel/agents/` | TriageAgent, EvidenceAgent, ThreatHunterAgent, VoiceNLPEngine |
| **Scenario Simulator** | Integration Lead | `sentinel/scenarios/` | Safe 5-stage cyber incident simulation & tamper-evidence demonstration |
| **Chrome Extension** | Frontend Lead | `extension/` (Manifest V3) | SOC dashboard, browser telemetry ingestion, one-click action approval UI |

---

## 2. Shared Data Models & Event Schema

Every security event exchanged between the Chrome Extension, collectors, agents, and backend MUST conform to this schema:

```json
{
  "event_id": "evt-b94f1c8a32d1",
  "timestamp": "2026-10-10T12:45:00Z",
  "source": "auth-gateway-01",
  "event_type": "login_failed",
  "severity": "high",
  "host": "srv-prod-db01",
  "message": "Failed SSH login attempt for account 'admin' from 198.51.100.42",
  "payload": {
    "attempt": 1,
    "ip": "198.51.100.42",
    "port": 22,
    "protocol": "ssh"
  },
  "hash": "d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f...",
  "signature": "7a3f81e9b2184029482fba921048b29148560128...",
  "account": "admin",
  "principal": null,
  "endpoint": null
}
```

### Schema Definitions:
- `event_id`: Unique identifier (string or UUID).
- `timestamp`: Canonical ISO-8601 UTC timestamp ending in `Z`.
- `source`: Telemetry provider name (e.g. `chrome-extension`, `auth-gateway`, `edr-agent`).
- `event_type`: Normalized event type (`login_failed`, `privileged_access`, `database_activity`, `edr_heartbeat`, `network_egress_anomaly`).
- `severity`: One of `["info", "low", "medium", "high", "critical"]`.
- `host`: Hostname or IP address of the target or origin system.
- `message`: Descriptive human-readable summary.
- `payload`: Structured JSON object with domain-specific telemetry.
- `hash`: SHA-256 canonical hash of the event contents (excluding `hash` and `signature`).
- `signature`: HMAC-SHA256 signature calculated over `hash`.
- `account` / `principal` / `endpoint`: Context fields ingested directly by `detection.detector`.

---

## 3. Cryptographic Evidence Ledger Protocol

To guarantee tamper resistance:
1. **Canonicalization**: The event dictionary is serialized with sorted keys and compact separators (`separators=(',', ':')`).
2. **Event Sealing**:
   $$\text{canonical\_hash} = \text{SHA-256}(\text{canonical\_json}(\text{event}))$$
   $$\text{signature} = \text{HMAC-SHA256}(\text{canonical\_hash}, \text{SecretKey})$$
3. **Block Chaining**:
   $$\text{chain\_hash} = \text{SHA-256}(\text{previous\_hash} + ":" + \text{canonical\_hash} + ":" + \text{timestamp})$$
   - The genesis block uses `0000000000000000000000000000000000000000000000000000000000000000` as `previous_hash`.
4. **Verification**:
   Any modification to historical database logs causes:
   - Canonical hash recalculation mismatch.
   - HMAC signature failure.
   - Chained hash divergence in subsequent blocks.
   The backend flags the record as `TAMPERED` and raises an immediate security alert.

---

## 4. API Endpoints Contract

Base URL: `http://localhost:8000`

### 1. `GET /api/status`
- **Purpose**: System health, active engine components, database metrics.
- **Response**:
```json
{
  "service": "AEGISX Sentinel API",
  "version": "1.0.0-techashy",
  "status": "ONLINE",
  "timestamp": "2026-10-10T12:50:00Z",
  "components": {
    "database": "CONNECTED",
    "evidence_ledger": "ACTIVE",
    "detection_engine": "ACTIVE",
    "ai_multi_agent": "READY",
    "chrome_extension_gateway": "LISTENING"
  },
  "metrics": {
    "total_events": 15,
    "total_evidence_blocks": 15,
    "registered_sources": 4,
    "pending_approval_actions": 3,
    "total_actions": 4
  },
  "safety_mode": "SIMULATION_SAFE (No real system modifications)"
}
```

### 2. `GET /api/events`
- **Query Params**: `severity`, `source`, `event_type`, `host`, `limit` (default 100), `offset` (default 0).
- **Response**: `{ "total": 15, "limit": 100, "offset": 0, "events": [...] }`

### 3. `POST /api/events`
- **Purpose**: Ingest individual or batch security events. Automatically hashes, signs, creates chained evidence blocks, and runs detection engine.
- **Request Body**: Single `EventCreate` object or list `[EventCreate, ...]` or `{ "events": [...] }`.
- **Response**:
```json
{
  "status": "success",
  "ingested_count": 1,
  "events": [...],
  "findings": [...],
  "pending_actions_generated": 1
}
```

### 4. `GET /api/sources`
- **Purpose**: Telemetry source registry and heartbeat statuses.
- **Response**:
```json
{
  "total_sources": 3,
  "sources": [
    {
      "source": "auth-gateway-01",
      "host": "srv-prod-db01",
      "first_seen": "2026-10-10T12:40:00Z",
      "last_seen": "2026-10-10T12:48:00Z",
      "event_count": 12,
      "status": "ACTIVE"
    }
  ]
}
```

### 5. `GET /api/evidence`
- **Purpose**: Inspect cryptographic evidence ledger and perform real-time chain audit.
- **Response**:
```json
{
  "total_records": 10,
  "ledger_valid": false,
  "tampered_count": 1,
  "violations": [
    {
      "evidence_id": "evid-abc12345",
      "event_id": "sim-tamper-4f21",
      "reason": "INVALID_SIGNATURE"
    }
  ],
  "records": [...]
}
```

### 6. `POST /api/scenario/run`
- **Purpose**: Run safe 5-stage simulated cyber incident.
- **Request Body** (optional):
```json
{
  "target_host": "srv-prod-db01",
  "target_account": "admin",
  "scenario_name": "APT_INTRUSION_AND_TAMPER"
}
```
- **Response**: Summary of simulated stages executed, events created, detection findings, tamper detection verification, and generated actions requiring approval.

### 7. `POST /api/investigate`
- **Purpose**: Trigger multi-agent AI incident analysis (Triage, Evidence, Threat Hunter).
- **Request Body**:
```json
{
  "query": "Investigate suspicious login and db exfiltration on srv-prod-db01",
  "incident_id": "inc-01",
  "focus": "all"
}
```
- **Response**: Synthesized investigation report with composite confidence score, MITRE ATT&CK mapping, timeline, and recommended actions.

### 8. `POST /api/voice/query`
- **Purpose**: Voice/text query processing for hands-free SOC operation.
- **Request Body**:
```json
{
  "query_text": "What is the status of the evidence ledger?"
}
```
- **Response**:
```json
{
  "query_text": "What is the status of the evidence ledger?",
  "speech_text": "Evidence ledger audit complete. All 15 records are cryptographically verified with zero tamper anomalies detected.",
  "intent": "tamper_audit",
  "entities": { "query_length": 42 },
  "data_payload": { ... }
}
```

### 9. `POST /api/actions/approve`
- **Purpose**: Human-in-the-loop operator authorization for simulated response actions.
- **Request Body**:
```json
{
  "action_id": "act-a1b2c3d4",
  "decision": "approve",
  "approver": "lead_soc_analyst@aegisx.local",
  "justification": "Authorized host isolation after confirmed brute force"
}
```
- **Response**:
```json
{
  "status": "success",
  "message": "Action 'act-a1b2c3d4' approved and safely simulated.",
  "action": {
    "action_id": "act-a1b2c3d4",
    "status": "EXECUTED_SIMULATED",
    "approver": "lead_soc_analyst@aegisx.local",
    "decision_at": "2026-10-10T12:52:00Z",
    "simulated_execution_log": "[SIMULATED SAFE EXECUTION] ... Zero real system changes made."
  }
}
```

---

## 5. Human-in-the-Loop Approval Protocol

1. **Zero Autonomous Real Execution**:
   Under no circumstances may automated agents execute active containment (e.g. host isolation, credential revocation) without human operator authorization.
2. **State Machine**:
   - Initial State: `PENDING_APPROVAL`
   - Allowed Transitions:
     - `PENDING_APPROVAL` $\rightarrow$ `EXECUTED_SIMULATED` (via `decision: "approve"`)
     - `PENDING_APPROVAL` $\rightarrow$ `REJECTED` (via `decision: "reject"`)
3. **Audit Trail**:
   Every decision records the operator's identity (`approver`), exact timestamp (`decision_at`), justification string, and simulated execution logs.

---

## 6. Chrome Extension (Manifest V3) Integration Contract

- **Permissions**: `storage`, `alarms`
- **Host Permissions**: `["http://localhost:8000/*"]`
- **Endpoints Used by Extension**:
  - Polling `GET /api/status` every 5 seconds for top navbar indicator (ONLINE/OFFLINE).
  - Polling `GET /api/actions?status=PENDING_APPROVAL` to badge pending actions count.
  - Submitting `POST /api/actions/approve` on user clicking "Approve" or "Reject".
  - Ingesting active tab / web telemetry via `POST /api/events`.
  - Voice query bar sending voice transcription to `POST /api/voice/query`.
