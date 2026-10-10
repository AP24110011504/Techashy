"""
AEGISX Sentinel – MCP Server (stdio / JSON-RPC 2.0).

Exposes five tools over the MCP protocol:
  READ-ONLY:
    get_incident_events        – events + timeline for an incident
    get_source_health          – verified / tampered / missing counts
    get_evidence_verification  – evidence summary + uncertainty notes
    get_attack_timeline        – full timeline, findings, recommended actions

  WRITE (simulated, human approval required):
    approve_containment_action – simulated action from explicit allow-list only

SAFETY:
  - No shell access.
  - No arbitrary system calls.
  - approve_containment_action accepts only ContainmentAction enum values.
  - All actions are SIMULATED — no real system changes are made.
  - GEMINI_API_KEY is read from the environment, never echoed.
  - Investigation results are stored in _investigation_cache (dict keyed by
    incident_id). The FastAPI router populates this after each investigation.
    Replace with Redis for multi-process deployments.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional

logging.basicConfig(level=logging.INFO, stream=sys.stderr)
logger = logging.getLogger(__name__)

# Allow running as `python -m aegisx_orchestrator.mcp_server.server`
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from aegisx_orchestrator.models import (
    ActionApprovalResponse,
    ActionStatus,
    ContainmentAction,
)

# ---------------------------------------------------------------------------
# Shared investigation cache
# Populated by api_router after every POST /api/investigate call.
# ---------------------------------------------------------------------------
_investigation_cache: Dict[str, Any] = {}


def _report(incident_id: str) -> Optional[Dict]:
    return _investigation_cache.get(incident_id)


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def _tool_get_incident_events(args: Dict) -> Dict:
    incident_id = args.get("incident_id", "").strip()
    if not incident_id:
        return {"error": "incident_id is required"}
    report = _report(incident_id)
    if report is None:
        return {"error": f"No report found for incident_id='{incident_id}'. "
                         "Run POST /api/investigate first."}
    return {
        "incident_id":  incident_id,
        "event_count":  len(report.get("timeline", [])),
        "events":       report.get("timeline", []),
    }


def _tool_get_source_health(args: Dict) -> Dict:
    incident_id = args.get("incident_id", "").strip()
    if not incident_id:
        return {"error": "incident_id is required"}
    report = _report(incident_id)
    if report is None:
        return {"error": f"No report found for incident_id='{incident_id}'"}

    timeline = report.get("timeline", [])
    verified   = sum(1 for e in timeline if e.get("verification_status") == "verified")
    tampered   = sum(1 for e in timeline if e.get("verification_status") == "tampered")
    missing    = sum(1 for e in timeline if e.get("verification_status") == "missing")
    total      = len(timeline)

    if tampered > 0:
        health = "compromised"
    elif total > 0 and missing / total > 0.3:
        health = "degraded"
    else:
        health = "healthy"

    return {
        "incident_id":              incident_id,
        "source_health":            health,
        "verified_events":          verified,
        "tampered_events":          tampered,
        "missing_evidence_events":  missing,
        "total_events":             total,
    }


def _tool_get_evidence_verification(args: Dict) -> Dict:
    incident_id = args.get("incident_id", "").strip()
    if not incident_id:
        return {"error": "incident_id is required"}
    report = _report(incident_id)
    if report is None:
        return {"error": f"No report found for incident_id='{incident_id}'"}

    findings       = report.get("findings", [])
    tamper_f       = [f for f in findings if "tamper" in f.get("title", "").lower()]
    missing_f      = [f for f in findings if "missing" in f.get("title", "").lower()]

    return {
        "incident_id":               incident_id,
        "uncertainty_count":         len(report.get("uncertainty", [])),
        "uncertainty_notes":         report.get("uncertainty", []),
        "tamper_findings":           tamper_f,
        "missing_evidence_findings": missing_f,
        "llm_augmented":             report.get("llm_augmented", False),
    }


def _tool_get_attack_timeline(args: Dict) -> Dict:
    incident_id = args.get("incident_id", "").strip()
    if not incident_id:
        return {"error": "incident_id is required"}
    report = _report(incident_id)
    if report is None:
        return {"error": f"No report found for incident_id='{incident_id}'"}

    return {
        "incident_id":         incident_id,
        "summary":             report.get("summary", ""),
        "timeline":            report.get("timeline", []),
        "findings":            report.get("findings", []),
        "recommended_actions": report.get("recommended_actions", []),
    }


def _tool_approve_containment_action(args: Dict) -> Dict:
    """
    Simulated containment action execution.

    Required args: incident_id, action, approved_by, justification
    Optional args: target (IP / username / session ID)

    action MUST be one of the ContainmentAction enum values.
    approved_by and justification are mandatory — human oversight is enforced.
    No real system change is made.
    """
    incident_id   = args.get("incident_id", "").strip()
    action_str    = args.get("action", "").strip()
    target        = args.get("target", "").strip() or None
    approved_by   = args.get("approved_by", "").strip()
    justification = args.get("justification", "").strip()

    if not incident_id:
        return {"error": "incident_id is required"}
    if not approved_by:
        return {"error": "approved_by is required — human approval is mandatory"}
    if not justification:
        return {"error": "justification is required"}

    try:
        action = ContainmentAction(action_str)
    except (ValueError, TypeError):
        return {
            "error": f"Invalid action '{action_str}'. "
                     f"Allowed: {[a.value for a in ContainmentAction]}"
        }

    response = ActionApprovalResponse(
        incident_id=incident_id,
        action=action,
        status=ActionStatus.EXECUTED,
        executed_at=datetime.now(timezone.utc),
        simulation_note=(
            f"SIMULATED ACTION: '{action.value}' "
            f"| target='{target}' "
            f"| approved_by='{approved_by}'. "
            "No real system change was made."
        ),
    )

    logger.info(
        "[AUDIT] MCP action: incident=%s action=%s target=%s approver=%s",
        incident_id, action.value, target, approved_by,
    )
    return response.model_dump(mode="json")


# ---------------------------------------------------------------------------
# Tool registry
# ---------------------------------------------------------------------------

TOOLS: Dict[str, Dict] = {
    "get_incident_events": {
        "description": "Return the security event timeline for an incident.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "incident_id": {"type": "string", "description": "The incident ID to query."}
            },
            "required": ["incident_id"],
        },
        "fn": _tool_get_incident_events,
    },
    "get_source_health": {
        "description": "Return health of event sources: verified / tampered / missing counts.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "incident_id": {"type": "string"}
            },
            "required": ["incident_id"],
        },
        "fn": _tool_get_source_health,
    },
    "get_evidence_verification": {
        "description": "Return evidence verification summary including tampering and uncertainty notes.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "incident_id": {"type": "string"}
            },
            "required": ["incident_id"],
        },
        "fn": _tool_get_evidence_verification,
    },
    "get_attack_timeline": {
        "description": "Return the full reconstructed attack timeline, findings, and recommended actions.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "incident_id": {"type": "string"}
            },
            "required": ["incident_id"],
        },
        "fn": _tool_get_attack_timeline,
    },
    "approve_containment_action": {
        "description": (
            "Execute a SIMULATED containment action. "
            "Human approved_by and justification are mandatory. "
            f"Allowed actions: {[a.value for a in ContainmentAction]}"
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "incident_id":   {"type": "string"},
                "action":        {"type": "string", "enum": [a.value for a in ContainmentAction]},
                "target":        {"type": "string", "description": "IP, username, or session ID."},
                "approved_by":   {"type": "string", "description": "Human approver identity."},
                "justification": {"type": "string"},
            },
            "required": ["incident_id", "action", "approved_by", "justification"],
        },
        "fn": _tool_approve_containment_action,
    },
}


# ---------------------------------------------------------------------------
# MCP JSON-RPC 2.0 stdio loop
# ---------------------------------------------------------------------------

def _send(obj: Dict) -> None:
    sys.stdout.write(json.dumps(obj, default=str) + "\n")
    sys.stdout.flush()


def _handle(req: Dict) -> Optional[Dict]:
    method  = req.get("method", "")
    req_id  = req.get("id")
    params  = req.get("params") or {}

    if method == "initialize":
        return {
            "jsonrpc": "2.0", "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "serverInfo": {"name": "aegisx-sentinel-mcp", "version": "0.1.0"},
                "capabilities": {"tools": {}},
            },
        }

    if method == "tools/list":
        return {
            "jsonrpc": "2.0", "id": req_id,
            "result": {
                "tools": [
                    {"name": name, "description": meta["description"],
                     "inputSchema": meta["inputSchema"]}
                    for name, meta in TOOLS.items()
                ]
            },
        }

    if method == "tools/call":
        name = params.get("name", "")
        tool_args = params.get("arguments") or {}
        if name not in TOOLS:
            return {
                "jsonrpc": "2.0", "id": req_id,
                "error": {"code": -32601, "message": f"Unknown tool: {name}"},
            }
        try:
            result = TOOLS[name]["fn"](tool_args)
            return {
                "jsonrpc": "2.0", "id": req_id,
                "result": {"content": [{"type": "text", "text": json.dumps(result, default=str)}]},
            }
        except Exception as exc:
            logger.error("Tool %s error: %s", name, exc, exc_info=True)
            return {
                "jsonrpc": "2.0", "id": req_id,
                "error": {"code": -32000, "message": str(exc)},
            }

    if method == "notifications/initialized":
        return None  # notifications get no response

    return {
        "jsonrpc": "2.0", "id": req_id,
        "error": {"code": -32601, "message": f"Method not found: {method}"},
    }


def run_mcp_server() -> None:
    """Entry point: reads JSON-RPC requests from stdin, writes responses to stdout."""
    logger.info("AEGISX Sentinel MCP Server started (stdio).")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError as exc:
            _send({"jsonrpc": "2.0", "id": None,
                   "error": {"code": -32700, "message": f"Parse error: {exc}"}})
            continue
        resp = _handle(req)
        if resp is not None:
            _send(resp)


if __name__ == "__main__":
    run_mcp_server()
