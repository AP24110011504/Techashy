# AEGISX Sentinel – TEAM_CONTRACT.md

## Overview
Person 3 owns multi-agent orchestration and the MCP server.
This file is the binding interface contract for the whole team.

---

## Team Lead (Person 1) – 2-line integration

Add to your main FastAPI `main.py`:

```python
from aegisx_orchestrator.api_router import router as orchestrator_router
app.include_router(orchestrator_router)
```

That registers all five endpoints without touching your existing routes.

---

## API Endpoints (registered by this module)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/investigate` | Run full multi-agent investigation |
| `GET`  | `/api/events/{incident_id}` | Get event timeline |
| `GET`  | `/api/sources/{incident_id}` | Get source health |
| `GET`  | `/api/evidence/{incident_id}` | Get evidence verification summary |
| `POST` | `/api/actions/approve` | Approve simulated containment action |

---

## POST /api/investigate

### Request body
```json
{
  "incident_id": "INC-2026-001",
  "requester":   "sentinel-auto",
  "events": [
    {
      "event_id":            "EVT-001",
      "timestamp":           "2026-10-10T10:00:00Z",
      "event_type":          "auth_failure",
      "severity":            "medium",
      "source_ip":           "203.0.113.42",
      "user":                "admin",
      "host":                "auth-server-01",
      "description":         "Failed login for admin",
      "fast_detector_flag":  true,
      "fast_detector_score": 0.72
    }
  ],
  "evidence": [
    {
      "evidence_id":         "EVI-001",
      "event_id":            "EVT-001",
      "sha256_hash":         "<actual computed hash>",
      "expected_hash":       "<stored reference hash>",
      "signature_valid":     true,
      "verification_status": "verified",
      "verified_at":         "2026-10-10T10:01:00Z"
    }
  ]
}
```

### Response body (`InvestigationReport`)
```json
{
  "incident_id":   "INC-2026-001",
  "generated_at":  "2026-10-10T10:10:00Z",
  "summary":       "...",
  "timeline":      [...],
  "findings":      [...],
  "uncertainty":   [...],
  "recommended_actions": [...],
  "llm_augmented": false,
  "agent_trace":   [...]
}
```

---

## POST /api/actions/approve

```json
{
  "incident_id":   "INC-2026-001",
  "action":        "block_ip",
  "target":        "203.0.113.42",
  "approved_by":   "security-lead",
  "justification": "Source IP of brute-force attack"
}
```

**Allowed `action` values** (no others accepted):
`block_ip` · `disable_account` · `isolate_endpoint` ·
`revoke_session` · `alert_team` · `increase_log_verbosity`

---

## Person 2 (Crypto/Evidence) interface

Produce `EvidenceRecord` objects and pass them in the `evidence` array:

```python
from aegisx_orchestrator.models import EvidenceRecord, VerificationStatus

EvidenceRecord(
    evidence_id         = "EVI-001",
    event_id            = "EVT-001",       # must match a SecurityEvent.event_id
    sha256_hash         = "<computed>",
    expected_hash       = "<stored>",
    signature_valid     = True,
    verification_status = VerificationStatus.VERIFIED,  # set by crypto code only
    verified_at         = datetime.now(timezone.utc),
)
```

> **Critical**: `verification_status` is set exclusively by Person 2's
> deterministic crypto code. The orchestrator never fabricates or overrides it.

---

## Person 1 (Edge Detection) interface

Set two optional fields on each `SecurityEvent`:
```python
event.fast_detector_flag  = True   # bool
event.fast_detector_score = 0.87   # float 0.0–1.0
```

---

## Safety invariants

| Rule | Enforcement |
|------|-------------|
| `raw_log` never sent to LLM | `investigation_agent.augment_with_llm()` excludes it |
| No hash fabrication | `ev_map[id] = None` when evidence missing |
| LLM cannot change verdict fields | All fields set before LLM call |
| Containment action allow-list | `ContainmentAction` enum + `ValueError` guard |
| Human approval mandatory | `approved_by` + `justification` required fields |
| Agent failures isolated | Individual try/except per agent in orchestrator |
| Every action audited | `logger.info("[AUDIT]…")` in router and MCP server |

---

## MCP Server

Run standalone:
```powershell
python -m aegisx_orchestrator.mcp_server.server
```

Communicates via stdin/stdout (JSON-RPC 2.0).
Tools: `get_incident_events`, `get_source_health`,
`get_evidence_verification`, `get_attack_timeline`,
`approve_containment_action`.
