# AEGISX Sentinel — Engineering & Team Contract

**Hackathon Demo & System Integration Protocol**  
**Version:** 1.1.0  
**Project:** AEGISX Sentinel — AI-Powered Cybersecurity First Responder  
**Frontend:** React SOC Dashboard  
**Backend:** FastAPI, multi-agent orchestrator, evidence engine, MCP server

---

## 1. Project Overview

AEGISX Sentinel is an AI-powered cybersecurity investigation and response platform designed for Security Operations Centers (SOCs).

Its objectives are to:

1. Detect suspicious activity across IAM, EDR, firewall, server, cloud, and database telemetry.
2. Verify telemetry integrity using cryptographic hashes, digital signatures, and a hash-linked evidence ledger.
3. Coordinate multi-agent investigations and correlate events with evidence.
4. Provide natural-language investigation through voice and text using Ask AEGISX.
5. Present investigation results, source health, and evidence integrity in a React SOC dashboard.
6. Support human-approved containment workflows with explicit approval and audit trails.

### System architecture

The project contains these major components:

- **Detection:** deterministic event rules and threat scoring.
- **Orchestration:** coordinates detection, evidence review, investigation, and reporting.
- **Evidence engine:** canonicalization, hashing, signature verification, and ledger operations.
- **FastAPI backend:** exposes investigation and supporting API routes.
- **MCP server:** exposes investigation capabilities through JSON-RPC over standard input/output.
- **React dashboard:** presents incidents, event timelines, source health, evidence verification, and containment approvals.

The backend, evidence engine, MCP server, and dashboard must retain clear interfaces. Changes to shared interfaces must be communicated to all team members.

---

## 2. API Integration Contract

The backend and frontend currently use different API conventions. The frontend must use an API client or adapter to translate its dashboard requests into the actual backend request and response formats.

**Do not assume that an endpoint exists merely because it is specified in this document.** Verify that the corresponding FastAPI route is registered before using it.

### 2.1 Existing orchestrator API

The orchestrator module exposes the following routes according to its team contract:

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/investigate` | Run a multi-agent investigation |
| GET | `/api/events/{incident_id}` | Retrieve an incident timeline |
| GET | `/api/sources/{incident_id}` | Retrieve source health |
| GET | `/api/evidence/{incident_id}` | Retrieve evidence verification |
| POST | `/api/actions/approve` | Approve a simulated containment action |

The actual registered routes and their response models must be verified against `aegisx_orchestrator/api_router.py`.

The MCP server is launched with:

```powershell
python -m aegisx_orchestrator.mcp_server.server
```

It communicates over standard input/output using JSON-RPC 2.0.

### 2.2 Frontend dashboard API contract

The dashboard uses the following normalized API interface. These routes are frontend integration requirements and must be implemented by the backend or an API adapter before the frontend treats them as available.

#### Endpoint 1 — `GET /api/status`

Purpose: retrieve service health and dashboard summary.

Expected response:

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

Values must reflect actual backend state. If a metric is unavailable, the backend must return an explicit unavailable value or document its derivation instead of inventing a live metric.

#### Endpoint 2 — `POST /api/scenario/run`

Purpose: trigger an explicitly simulated attack scenario for a controlled demo.

Request:

```json
{
  "scenarioId": "attack-sim-apt29-db-breach",
  "intensity": "high"
}
```

Expected response schema:

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
  "affectedAssets": [
    "auth-srv-us-east-1",
    "prod-db-replica-02",
    "iam-admin-vault"
  ],
  "message": "Simulation completed.",
  "timestamp": "2026-10-10T11:00:15Z"
}
```

All simulated records must be clearly identified as test or demo data. A simulation must not execute real containment actions.

#### Endpoint 3 — `GET /api/events`

Purpose: retrieve chronological incident events.

Request:

`GET /api/events?incidentId=INC-2026-9042`

Expected response structure:

```json
{
  "incidentId": "INC-2026-9042",
  "total": 1,
  "events": [
    {
      "id": "EVT-1001",
      "timestamp": "2026-10-10T10:42:15Z",
      "relativeTime": "18m ago",
      "source": "IAM",
      "severity": "CRITICAL",
      "description": "Example event description",
      "evidenceStatus": "VERIFIED",
      "rawHash": "actual-computed-sha256",
      "assetId": "auth-srv-us-east-1"
    }
  ]
}
```

The example event is illustrative only. The backend must populate the response from actual stored or explicitly simulated events.

#### Endpoint 4 — `GET /api/sources`

Purpose: display health and trust information for telemetry sources.

Expected response structure:

```json
{
  "sources": [
    {
      "id": "src-iam",
      "name": "IAM",
      "category": "Identity Provider",
      "status": "HEALTHY",
      "trustScore": 95,
      "lastUpdated": "2026-10-10T10:58:30Z",
      "telemetryRate": "unavailable",
      "summary": "Source health information"
    }
  ]
}
```

The sample values must not be presented as live telemetry unless obtained from a real source or explicitly labelled as simulation data.

#### Endpoint 5 — `GET /api/evidence`

Purpose: retrieve evidence integrity verification.

Request:

`GET /api/evidence?incidentId=INC-2026-9042`

Expected response structure:

```json
{
  "incidentId": "INC-2026-9042",
  "chainValid": true,
  "immutableAuditHeight": null,
  "verifiedTimestamp": "2026-10-10T10:59:40Z",
  "evidenceRecords": [
    {
      "id": "EVD-4091",
      "source": "EDR",
      "hashVerification": "VALID",
      "expectedHash": "actual-expected-hash",
      "calculatedHash": "actual-calculated-hash",
      "signatureVerification": "VALID",
      "signerKeyId": "actual-key-id",
      "integrityResult": "UNALTERED",
      "verificationTimestamp": "2026-10-10T10:54:10Z",
      "chainProof": null
    }
  ]
}
```

The API must use actual verification results. It must not manufacture signatures, hashes, chain proofs, or verification outcomes. If the underlying ledger does not provide a field, return `null` or omit the field according to the agreed schema.

#### Endpoint 6 — `POST /api/investigate`

Purpose: run or retrieve a multi-agent investigation.

The existing orchestrator contract accepts an `InvestigationRequest` containing an incident identifier, events, and evidence. Its response is an `InvestigationReport`.

Example request:

```json
{
  "incident_id": "INC-2026-9042",
  "events": [],
  "evidence": []
}
```

The dashboard may use a simpler request:

```json
{
  "incidentId": "INC-2026-9042",
  "scope": "full"
}
```

The frontend adapter must translate the simplified dashboard request into the backend's actual request format. It must not discard required event or evidence data.

The normalized dashboard response may include:

- Incident identifier and analysis timestamp.
- Investigation findings and confidence.
- Supporting event identifiers.
- Uncertainty notes.
- Recommendations and approval requirements.

The adapter must derive these fields from the actual investigation report. It must not fabricate agent consensus or confidence scores.

#### Endpoint 7 — `POST /api/voice/query`

Purpose: provide natural-language security investigation.

Request:

```json
{
  "query": "What is the blast radius and which servers are affected?",
  "contextIncidentId": "INC-2026-9042"
}
```

Expected response structure:

```json
{
  "query": "What is the blast radius and which servers are affected?",
  "answer": "Answer generated from available investigation context.",
  "confidence": null,
  "suggestedActions": [],
  "timestamp": "2026-10-10T10:59:45Z"
}
```

The route must be connected to a real implemented query handler before being shown as available. Confidence may be omitted or `null` if the underlying component cannot calculate it reliably.

#### Endpoint 8 — `POST /api/actions/approve`

Purpose: accept a human approval decision for a proposed containment action.

The existing backend contract uses:

```json
{
  "incident_id": "INC-2026-9042",
  "action": "block_ip",
  "target": "203.0.113.42",
  "approved_by": "security-lead",
  "justification": "Source IP associated with suspicious activity"
}
```

The dashboard may use a normalized request:

```json
{
  "actionId": "ACT-ISO-PROD-DB",
  "decision": "APPROVED",
  "analystNote": "Approved after investigation review."
}
```

The API adapter must map these formats to the actual backend request and reject incomplete or invalid approvals.

An approval is not proof that a real action was executed. The current containment implementation must be labelled as simulated unless a real, explicitly authorized integration is implemented.

---

## 3. Frontend Architecture and Design Standards

### 3.1 Visual design

Use an enterprise SOC interface inspired by CrowdStrike Falcon, Linear, and Datadog.

| Element | Value |
|---|---|
| Background | `#131517` |
| Primary card | `#1B1F24` |
| Secondary surface | `#20252C` |
| Border | `#2B3139` |
| Primary text | `#E8EAED` |
| Secondary text | `#9AA3AF` |
| Accent | `#B7C7FF` |

Use emerald for success, amber for warnings, rose for critical alerts, and slate for offline or unavailable services.

Avoid flashy Matrix-style graphics. Prioritize readable typography, clear severity indicators, dense but organized information, and responsive layouts.

### 3.2 Dashboard components

The dashboard should provide:

1. System status and API connectivity.
2. Incident summary and severity.
3. Event timeline.
4. Telemetry source health.
5. Evidence integrity and signature verification.
6. Investigation findings and uncertainty.
7. Ask AEGISX text/voice query interface.
8. Human approval for proposed containment actions.
9. Explicit live, simulated, and offline indicators.

### 3.3 No unlabelled hardcoded data

- Load initial state from the API client.
- Display actual backend responses when endpoints are reachable.
- If the backend is unavailable, enable the explicit mock adapter.
- Display a prominent `MOCK DATA` badge whenever mock data is shown.
- Do not mix mock records with live records without clear labelling.
- Do not present a successful simulated containment as a real security action.
- Use loading, empty, error, and stale-data states for all data-driven panels.

---

## 4. Evidence Engine Contract

The evidence engine is responsible for deterministic evidence processing.

Its responsibilities include:

- Canonicalizing input before hashing.
- Computing and verifying SHA-256 hashes.
- Signing and verifying evidence using supported digital-signature algorithms.
- Recording evidence in the hash-linked ledger.
- Verifying ledger links and reporting integrity failures.
- Returning explicit unknown, invalid, and conflicting states.

The engine currently includes canonicalization, integrity, signatures, and ledger modules. Their presence does not imply durable storage or complete API integration.

### Evidence interface

The orchestrator consumes `EvidenceRecord` objects from the shared models.

Example:

```python
from datetime import datetime, timezone

from aegisx_orchestrator.models import (
    EvidenceRecord,
    VerificationStatus,
)

record = EvidenceRecord(
    evidence_id="EVI-001",
    event_id="EVT-001",
    sha256_hash="<actual-computed-hash>",
    expected_hash="<stored-reference-hash>",
    signature_valid=True,
    verification_status=VerificationStatus.VERIFIED,
    verified_at=datetime.now(timezone.utc),
)
```

This example illustrates the interface only. Production values must be generated and verified by the cryptographic code, not copied from the example.

### Safety requirements

- The orchestrator must not fabricate evidence-verification results.
- Missing evidence must remain explicitly missing or unknown.
- Invalid signatures and hash mismatches must be reported.
- Raw logs must remain untrusted input.
- Raw logs must never be sent to the LLM.
- LLM output must not overwrite deterministic verdict fields.
- Ledger verification must report broken or inconsistent links.
- Persistence guarantees must be documented accurately.

---

## 5. Detection and Orchestration Contract

The orchestrator coordinates detection, evidence review, investigation, and reporting.

The deterministic detector currently defines these rule types:

1. Failed-login bursts.
2. Privileged access followed by database activity.
3. Stale EDR heartbeat.

The adapter currently maps supported failed-login events from the orchestration event schema into the detector's input format.

Additional rules must not be treated as integrated until the event mappings and tests are implemented.

### Detector findings

Rule-based findings must remain separate from evidence-correlated `Finding` objects.

The investigation report contains a dedicated `detector_findings` field. The adapter must preserve the detector's actual rule identifier, severity, explanation, event IDs, and detection timestamp.

### Failure isolation

- Each agent must be isolated with appropriate error handling.
- A detector failure must be recorded in the trace and uncertainty.
- A failure in one component should not silently fabricate successful results.
- Detector flags must be based on actual rule findings.
- The existing deterministic detector implementation must not be changed without coordinating the change with its owner.

---

## 6. MCP Server Contract

The MCP server runs as a standalone stdio process:

```powershell
python -m aegisx_orchestrator.mcp_server.server
```

It uses JSON-RPC 2.0 over standard input/output.

The existing tool set includes:

- `get_incident_events`
- `get_source_health`
- `get_evidence_verification`
- `get_attack_timeline`
- `approve_containment_action`

The MCP server must:

- Return tool results from actual application state.
- Validate tool arguments.
- Handle unknown tools and malformed requests.
- Keep diagnostic logging off the protocol's standard-output stream.
- Apply the same approval and audit requirements as the HTTP API.
- Clearly label simulated actions.
- Avoid reporting successful execution when an operation failed.

End-to-end MCP client connectivity and complete workflow validation must be tested separately.

---

## 7. Containment Approval and Safety

Supported action values in the existing backend contract are:

- `block_ip`
- `disable_account`
- `isolate_endpoint`
- `revoke_session`
- `alert_team`
- `increase_log_verbosity`

The backend must reject actions outside its allow-list.

Human approval requires an approver identity and justification. Every approval attempt must be audited.

The current simulated containment implementation must not be represented as a production firewall, IAM, or endpoint-control integration.

Real containment integrations require explicit authorization, target validation, failure handling, audit logging, and a documented rollback or recovery procedure.

---

## 8. Team Responsibilities and Integration Rules

### Person 1 — Edge Detection / Backend Integration

- Own edge-detection integration.
- Maintain the shared event schema.
- Connect the appropriate FastAPI application routes.
- Coordinate changes to detection and API contracts.

### Person 2 — Cryptography / Evidence

- Own evidence integrity and cryptographic verification.
- Produce deterministic evidence-verification results.
- Maintain hash, signature, and ledger tests.
- Document persistence and verification guarantees.

### Person 3 — Orchestration / MCP

- Own the multi-agent orchestrator.
- Maintain the MCP server and tool interfaces.
- Integrate detector findings into investigation reports.
- Preserve uncertainty and failure isolation.
- Maintain the approval and audit workflow.

### Frontend lead — React SOC Dashboard

- Implement the dashboard UI and API client.
- Follow the frontend design standards.
- Map frontend requests to actual backend schemas.
- Implement explicit mock mode and visible mock-data labels.
- Display incidents, events, evidence, investigation findings, and approval states accurately.

### Shared integration rules

1. Changes to shared models or routes must be communicated to the affected team members.
2. No team member should silently change a shared request or response schema.
3. Preserve unrelated working functionality when resolving merge conflicts.
4. Run the relevant tests before committing.
5. Do not merge code that depends on undocumented mock responses.
6. Document incomplete routes and unimplemented features.
7. Do not claim an end-to-end integration is complete until it has been exercised.

---

## 9. Testing and Completion Criteria

The following areas require independent verification:

- Existing automated tests pass.
- All supported detector rules work through the adapter.
- The evidence engine verifies hashes, signatures, and ledger links.
- Ledger persistence behaviour is documented and tested.
- Dashboard API routes match the actual backend contracts.
- Mock mode is clearly labelled and does not masquerade as live data.
- The dashboard can load and render actual API responses.
- The MCP server can be launched and exercised by an MCP client.
- Approval validation and audit logging work as expected.
- Simulated containment is clearly distinguished from real execution.

Passing unit tests is necessary but does not, by itself, prove that every API, dashboard, and MCP workflow is connected.

---

## 10. Final Integration Principle

AEGISX Sentinel must distinguish between **observed facts, deterministic findings, cryptographically verified evidence, AI-generated analysis, mock data, and simulated actions**.

No component may silently promote an unknown or simulated result to a verified or executed result.

The frontend, backend, evidence engine, detector, orchestrator, and MCP server must share documented interfaces and preserve these safety guarantees throughout the investigation lifecycle.