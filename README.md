# AEGISX Sentinel

### AI-Powered Cyber Evidence and Investigation System

AEGISX Sentinel is a hackathon project for detecting suspicious security activity, preserving tamper-evident evidence, and assisting security investigations.

## Planned Features

- Cryptographic evidence integrity verification
- Tamper-evident security event records
- Multi-agent AI investigation
- Chrome browser extension dashboard
- Local threat detection
- Voice and text interaction
- Human-approved response actions

## Technology Stack

- Chrome Extension (Manifest V3)
- Python and FastAPI
- AI agents and MCP
- Cryptographic hashing and digital signatures
- Local detection models and rules

## Project Status

Under development for Techashy 2.0 at IIIT Kottayam.

## Safety

Designed for controlled demonstrations and authorized security testing.

---

## Architecture & System Overview

AEGISX Sentinel delivers an end-to-end cyber defense telemetry, evidence preservation, and AI investigation platform:

1. **FastAPI Backend (`sentinel/api/`)**: High-throughput REST API serving telemetry ingestion, status, evidence queries, and human approvals.
2. **Detection Engine (`detection/detector.py`)**: Teammate detection module executing deterministic correlation rules for failed login bursts, privileged database access, and stale EDR heartbeats.
3. **Cryptographic Evidence Ledger (`sentinel/crypto/`)**: Tamper-evident blockchain-style ledger linking every security event with SHA-256 canonical hashing and HMAC-SHA256 signatures.
4. **AI Multi-Agent System (`sentinel/agents/`)**: Specialized AI agents (Triage, Evidence, Threat Hunter) that assess MITRE ATT&CK tactics, audit cryptographic chains, and formulate containment recommendations.
5. **Scenario Simulator (`sentinel/scenarios/`)**: Multi-stage cyber incident simulation covering credential attacks, network anomalies, database access, sensor heartbeat loss, and log tampering.
6. **Human-in-the-Loop Safeguards (`sentinel/schemas/action.py`)**: Enforces explicit human approval before any simulated containment action executes. Zero autonomous real-system modifications.

---

## Setup and Installation

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- `pip` package manager

### 1. Clone & Navigate to Repository
```bash
git clone https://github.com/AP24110011504/Techashy.git
cd Techashy
```

### 2. Create Virtual Environment (Optional but Recommended)
```bash
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## Running the Backend

### Start Server via CLI
```bash
python -m sentinel.main
```
Or start directly with `uvicorn`:
```bash
uvicorn sentinel.api.app:app --host 0.0.0.0 --port 8000 --reload
```

Once started:
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **API Health & Status**: [http://localhost:8000/api/status](http://localhost:8000/api/status)

---

## Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Backend status, engine health, and telemetry metrics |
| `GET` | `/api/events` | Query security events with filters (`severity`, `source`, `host`) |
| `POST` | `/api/events` | Ingest and cryptographically seal security event(s) |
| `GET` | `/api/sources` | Registered telemetry feeds and heartbeat statuses |
| `GET` | `/api/evidence` | Cryptographic evidence ledger and real-time chain audit |
| `POST` | `/api/scenario/run` | Execute 5-stage simulated cyber incident & tamper demo |
| `POST` | `/api/investigate` | Trigger AI multi-agent investigation (Triage, Evidence, Threat Hunter) |
| `POST` | `/api/voice/query` | Natural language voice & text assistant query interface |
| `POST` | `/api/actions/approve` | Human operator authorization for simulated response actions |
| `GET` | `/api/actions` | List all response actions and approval statuses |

---

## Running Simulated Incident Scenario

You can trigger a safe multi-stage demonstration incident with a single request:

```bash
curl -X POST http://localhost:8000/api/scenario/run \
  -H "Content-Type: application/json" \
  -d '{"target_host": "srv-prod-db01", "target_account": "admin"}'
```

This scenario safely simulates:
1. **Suspicious Login**: 5 rapid failed SSH logins for `admin` from `198.51.100.42`.
2. **Network Activity**: Outbound high-volume egress anomaly to `203.0.113.88:4444`.
3. **Database Access**: Privilege escalation by `svc_dbadmin` followed by bulk query on `customers_pii`.
4. **Sensor Heartbeat Loss**: Stale EDR heartbeat (> 10 minutes overdue).
5. **Simulated Log Tampering**: Modifies an audit log entry after sealing to demonstrate cryptographic proof of tampering.
6. **Proposed Containment Actions**: Automatically queues `ISOLATE_HOST`, `REVOKE_CREDENTIALS`, and `BLOCK_IP` actions in `PENDING_APPROVAL` state.

---

## Human Approval for Simulated Actions

To approve a pending mitigation action:
```bash
curl -X POST http://localhost:8000/api/actions/approve \
  -H "Content-Type: application/json" \
  -d '{
    "action_id": "<ACTION_ID>",
    "decision": "approve",
    "approver": "analyst@aegisx.local",
    "justification": "Confirmed brute-force attack on prod host"
  }'
```

---

## Chrome Extension (Manifest V3) Setup

AEGISX Sentinel includes a professional SOC dashboard Chrome extension located in the [`extension/`](extension/) directory.

### Loading in Chrome Developer Mode:
1. Ensure the backend server is running (`python -m sentinel.main`).
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** toggle in the upper-right corner.
4. Click **Load unpacked** in the upper-left corner.
5. Select the `Techashy/extension` directory.
6. Click the AEGISX Sentinel shield icon in the Chrome toolbar to launch the dashboard.

---

## Running Tests

AEGISX Sentinel includes unit tests for detector rules, schemas, cryptographic integrity, API endpoints, and end-to-end integration:

```bash
# Run all tests using pytest
pytest -v

# Or run using standard unittest
python -m unittest discover tests
```

See [TEAM_CONTRACT.md](file:///TEAM_CONTRACT.md) for complete component contracts and integration details.
