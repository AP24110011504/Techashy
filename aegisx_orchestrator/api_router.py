"""
AEGISX Sentinel – FastAPI router.

TEAM LEAD — integrate with two lines in your main.py:

    from aegisx_orchestrator.api_router import router as orchestrator_router
    app.include_router(orchestrator_router)

Routes registered:
    POST  /api/investigate          run multi-agent investigation
    GET   /api/events/{incident_id} get timeline events
    GET   /api/sources/{incident_id} get source health
    GET   /api/evidence/{incident_id} get evidence verification summary
    POST  /api/actions/approve      approve simulated containment action
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from .models import (
    ActionApprovalRequest,
    ActionApprovalResponse,
    ActionStatus,
    ContainmentAction,
    InvestigationReport,
    InvestigationRequest,
)
from .orchestrator import run_investigation
from .mcp_server.server import (
    _investigation_cache,
    _tool_get_incident_events,
    _tool_get_source_health,
    _tool_get_evidence_verification,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AEGISX Sentinel"])


# ── POST /api/investigate ────────────────────────────────────────────────────

@router.post("/api/investigate", response_model=InvestigationReport)
async def investigate(request: InvestigationRequest) -> InvestigationReport:
    """
    Run the full multi-agent investigation pipeline.

    Accepts real SecurityEvent and EvidenceRecord objects from the caller.
    Returns a structured InvestigationReport.
    Results are cached by incident_id for MCP tool queries.
    """
    try:
        report = run_investigation(request)
        # Populate MCP tool cache
        _investigation_cache[request.incident_id] = report.model_dump(mode="json")
        return report
    except Exception as exc:
        logger.error("Investigation failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Investigation failed: {exc}")


# ── GET /api/events/{incident_id} ────────────────────────────────────────────

@router.get("/api/events/{incident_id}")
async def get_events(incident_id: str):
    """Return the event timeline for a given incident."""
    result = _tool_get_incident_events({"incident_id": incident_id})
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ── GET /api/sources/{incident_id} ──────────────────────────────────────────

@router.get("/api/sources/{incident_id}")
async def get_sources(incident_id: str):
    """Return source health (verified / tampered / missing event counts)."""
    result = _tool_get_source_health({"incident_id": incident_id})
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ── GET /api/evidence/{incident_id} ─────────────────────────────────────────

@router.get("/api/evidence/{incident_id}")
async def get_evidence(incident_id: str):
    """Return evidence verification summary and uncertainty notes."""
    result = _tool_get_evidence_verification({"incident_id": incident_id})
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# ── POST /api/actions/approve ────────────────────────────────────────────────

@router.post("/api/actions/approve", response_model=ActionApprovalResponse)
async def approve_action(request: ActionApprovalRequest) -> ActionApprovalResponse:
    """
    Approve and execute a SIMULATED containment action.

    approved_by and justification are mandatory — human oversight is enforced.
    action must be one of the explicit allow-list values.
    No real system changes are made.
    """
    try:
        action = ContainmentAction(request.action)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Allowed: {[a.value for a in ContainmentAction]}",
        )

    response = ActionApprovalResponse(
        incident_id=request.incident_id,
        action=action,
        status=ActionStatus.EXECUTED,
        executed_at=datetime.now(timezone.utc),
        simulation_note=(
            f"SIMULATED ACTION: '{action.value}' "
            f"| target='{request.target}' "
            f"| approved_by='{request.approved_by}'. "
            "No real system change was made."
        ),
    )

    logger.info(
        "[AUDIT] Action approved: incident=%s action=%s target=%s approver=%s",
        request.incident_id, action.value, request.target, request.approved_by,
    )
    return response
