"""
AEGISX Sentinel – Orchestrator / Coordinator.

Runs the 4-agent pipeline and returns an InvestigationReport.

Pipeline:
  1. DetectionAgent       – threat scoring
  2. EvidenceReviewAgent  – consume Person 2's crypto results
  3. InvestigationAgent   – correlate, timeline, findings
  4. Coordinator (here)   – merge, deterministic summary, optional LLM

Failure policy: each agent is wrapped in try/except.
  If an agent fails the pipeline continues in degraded mode.
  Failures are recorded in agent_trace and uncertainty.
"""

from __future__ import annotations

import logging
import traceback
from datetime import datetime, timezone
from typing import List

from .models import InvestigationReport, InvestigationRequest
from .agents import detection_agent, evidence_review_agent, investigation_agent

logger = logging.getLogger(__name__)


def run_investigation(request: InvestigationRequest) -> InvestigationReport:
    """
    Main entry point called by the team lead's FastAPI router.

        report = run_investigation(request)

    Returns a fully-populated InvestigationReport.
    All fields are deterministically computed.
    LLM is optional — if unavailable the report is still complete.
    """
    trace:       List[str] = []
    uncertainty: List[str] = []

    # ── Step 1: Detection ────────────────────────────────────────────────
    det = {
        "flagged_event_ids": [],
        "threat_level":      "unknown",
        "summary":           "",
        "agent_note":        "DetectionAgent[skipped]",
    }
    try:
        det = detection_agent.run(request.events)
        trace.append(f"[1] {det['agent_note']}: {det['summary']}")
    except Exception as exc:
        msg = f"[1] DetectionAgent FAILED: {exc}"
        trace.append(msg)
        uncertainty.append("Detection agent failed — threat level unknown.")
        logger.error(msg, exc_info=True)

    # ── Step 2: Evidence Review ──────────────────────────────────────────
    ev_res = {
        "ev_map": {}, "tampered_event_ids": [], "missing_event_ids": [],
        "unverifiable_event_ids": [], "verified_event_ids": [],
        "uncertainty_notes": [], "summary": "",
        "agent_note": "EvidenceReviewAgent[skipped]",
    }
    try:
        ev_res = evidence_review_agent.run(request.events, request.evidence)
        trace.append(f"[2] {ev_res['agent_note']}: {ev_res['summary']}")
    except Exception as exc:
        msg = f"[2] EvidenceReviewAgent FAILED: {exc}"
        trace.append(msg)
        uncertainty.append(
            "Evidence review failed — all events are unverified. "
            "Do not rely on integrity assessments."
        )
        logger.error(msg, exc_info=True)

    # ── Step 3: Investigation ────────────────────────────────────────────
    inv = {
        "timeline": [], "findings": [], "conflicts": [],
        "uncertainty_notes": [], "recommended_actions": [],
        "severity_summary": "unknown",
        "agent_note": "InvestigationAgent[skipped]",
    }
    try:
        inv = investigation_agent.investigate(
            events=request.events,
            evidence=request.evidence,
            detection_result=det,
            evidence_result=ev_res,
        )
        trace.append(
            f"[3] {inv['agent_note']}: "
            f"{len(inv['timeline'])} timeline entries, "
            f"{len(inv['findings'])} findings, "
            f"{len(inv['conflicts'])} conflicts."
        )
    except Exception as exc:
        msg = f"[3] InvestigationAgent FAILED: {exc}\n{traceback.format_exc()}"
        trace.append(msg)
        uncertainty.append("Investigation agent failed — no timeline or findings produced.")
        logger.error(msg, exc_info=True)

    # ── Step 4: Coordinator — merge ──────────────────────────────────────
    all_uncertainty = uncertainty + inv.get("uncertainty_notes", [])
    threat_level    = inv.get("severity_summary") or det.get("threat_level", "unknown")
    n_findings      = len(inv.get("findings", []))
    n_conflicts     = len(inv.get("conflicts", []))

    deterministic_summary = (
        f"Incident {request.incident_id}: "
        f"Threat level {threat_level.upper()}. "
        f"{det.get('summary', '')} "
        f"{ev_res.get('summary', '')} "
        f"{n_findings} finding(s) identified, {n_conflicts} conflict(s) detected."
    ).strip()

    # Optional LLM narrative
    llm_summary   = None
    llm_augmented = False
    try:
        llm_summary = investigation_agent.augment_with_llm(
            findings=inv.get("findings", []),
            timeline=inv.get("timeline", []),
            uncertainty_notes=all_uncertainty,
        )
    except Exception as exc:
        logger.warning(f"LLM augmentation call raised: {exc}")

    if llm_summary:
        final_summary = llm_summary
        llm_augmented = True
        trace.append("[4] Coordinator: LLM narrative applied.")
    else:
        final_summary = deterministic_summary
        trace.append("[4] Coordinator: Deterministic summary used (LLM unavailable or unset).")

    return InvestigationReport(
        incident_id=request.incident_id,
        generated_at=datetime.now(timezone.utc),
        summary=final_summary,
        timeline=inv.get("timeline", []),
        findings=inv.get("findings", []),
        uncertainty=all_uncertainty,
        recommended_actions=inv.get("recommended_actions", []),
        llm_augmented=llm_augmented,
        agent_trace=trace,
    )
