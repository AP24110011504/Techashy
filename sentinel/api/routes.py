import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import ValidationError

from detection.detector import detect_events
from sentinel.agents.orchestrator import AgentOrchestrator
from sentinel.config import SERVICE_NAME, SERVICE_VERSION
from sentinel.crypto.integrity import (
    compute_canonical_event_hash,
    compute_chain_hash,
    compute_event_signature,
    verify_chain_integrity,
    verify_event_signature,
)
from sentinel.scenarios.simulator import ScenarioSimulator
from sentinel.schemas.action import (
    ActionDecisionRequest,
    ActionDecisionResponse,
    ActionListResponse,
    ActionStatus,
    SimulatedAction,
)
from sentinel.schemas.event import (
    EventCreate,
    EventIngestResponse,
    EventListResponse,
    EventModel,
    SeverityEnum,
)
from sentinel.schemas.evidence import EvidenceLedgerResponse, EvidenceRecord
from sentinel.schemas.investigation import InvestigationRequest, InvestigationResponse
from sentinel.schemas.voice import VoiceQueryRequest, VoiceQueryResponse
from sentinel.storage.database import Database

router = APIRouter(prefix="/api", tags=["AEGISX Sentinel"])


def get_db(request: Request) -> Database:
    return request.app.state.db


def get_orchestrator(request: Request) -> AgentOrchestrator:
    return request.app.state.orchestrator


@router.get("/status", summary="Get system status and component health")
def get_status(db: Database = Depends(get_db)) -> Dict[str, Any]:
    """Returns operational status, uptime, database metrics, and active engine states."""
    counts = db.get_status_counts()
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "status": "ONLINE",
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "components": {
            "database": "CONNECTED",
            "evidence_ledger": "ACTIVE",
            "detection_engine": "ACTIVE",
            "ai_multi_agent": "READY",
            "chrome_extension_gateway": "LISTENING",
        },
        "metrics": counts,
        "safety_mode": "SIMULATION_SAFE (No real system modifications)",
    }


@router.get("/events", response_model=EventListResponse, summary="Query security events")
def list_events(
    severity: Optional[str] = Query(None, description="Filter by severity: info, low, medium, high, critical"),
    source: Optional[str] = Query(None, description="Filter by reporting telemetry source"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    host: Optional[str] = Query(None, description="Filter by host"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Records offset for pagination"),
    db: Database = Depends(get_db),
):
    """Retrieve normalized events with optional filters."""
    total, events = db.get_events(
        severity=severity,
        source=source,
        event_type=event_type,
        host=host,
        limit=limit,
        offset=offset,
    )
    return EventListResponse(total=total, limit=limit, offset=offset, events=events)


@router.post("/events", response_model=EventIngestResponse, summary="Ingest event(s) and seal evidence")
def ingest_events(
    payload: Union[EventCreate, List[EventCreate], Dict[str, Any]],
    db: Database = Depends(get_db),
):
    """
    Ingests single event or batch of events.
    Verifies / generates cryptographic canonical hash and HMAC signature.
    Appends to tamper-evident evidence ledger and evaluates detection rules.
    """
    raw_events: List[EventCreate] = []

    if isinstance(payload, list):
        raw_events = payload
    elif isinstance(payload, EventCreate):
        raw_events = [payload]
    elif isinstance(payload, dict):
        if "events" in payload and isinstance(payload["events"], list):
            raw_events = [EventCreate(**e) for e in payload["events"]]
        else:
            raw_events = [EventCreate(**payload)]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payload must be an EventCreate object or list of events",
        )

    ingested_events: List[EventModel] = []

    for evt_create in raw_events:
        evt_dict = evt_create.model_dump()

        # Compute canonical hash
        computed_hash = compute_canonical_event_hash(evt_dict)

        # Validate provided hash if present
        if evt_create.hash and evt_create.hash != computed_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provided hash '{evt_create.hash}' does not match canonical event hash '{computed_hash}'.",
            )

        # Compute signature
        computed_sig = compute_event_signature(computed_hash)

        # Validate provided signature if present
        if evt_create.signature and not verify_event_signature(computed_hash, evt_create.signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid signature for event '{evt_create.event_id}'.",
            )

        event_model = EventModel(
            **{
                **evt_dict,
                "hash": computed_hash,
                "signature": computed_sig,
            }
        )

        db.save_event(event_model)
        db.upsert_source(event_model.source, event_model.host, event_model.timestamp)

        # Append to chained evidence ledger
        prev_hash = db.get_last_evidence_chain_hash()
        chain_hash = compute_chain_hash(prev_hash, computed_hash, event_model.timestamp)
        evidence_rec = EvidenceRecord(
            evidence_id=f"evid-{uuid.uuid4().hex[:8]}",
            event_id=event_model.event_id,
            canonical_hash=computed_hash,
            signature=computed_sig,
            previous_hash=prev_hash,
            chain_hash=chain_hash,
            timestamp=event_model.timestamp,
            integrity_status="VERIFIED",
            metadata={"source": event_model.source, "host": event_model.host},
        )
        db.add_evidence_record(evidence_rec)
        ingested_events.append(event_model)

    # Fetch recent context to evaluate teammate's detection rules
    _, recent_events = db.get_events(limit=50)
    all_context = [e.to_detector_dict() for e in recent_events]
    findings = detect_events(all_context)

    # Automatically generate proposed response actions for findings (PENDING_APPROVAL)
    pending_actions_count = 0
    for f in findings:
        rule_id = f.get("rule_id", "")
        # Find existing pending actions for this rule
        existing_actions = db.get_actions(status="PENDING_APPROVAL")
        if not any(a.rule_id == rule_id for a in existing_actions):
            act = SimulatedAction(
                rule_id=rule_id,
                target_host="srv-prod-db01",
                target_entity=f.get("explanation", "Detection anomaly"),
                action_type="ISOLATE_HOST" if "DB" in rule_id or "BURST" in rule_id else "RESTART_EDR_SENSOR",
                description=f"Simulated response action proposed by rule {rule_id}: {f.get('explanation')}",
                risk_level="high" if f.get("severity") in ["high", "critical"] else "medium",
                status=ActionStatus.PENDING_APPROVAL,
            )
            db.save_action(act)
            pending_actions_count += 1

    return EventIngestResponse(
        status="success",
        ingested_count=len(ingested_events),
        events=ingested_events,
        findings=findings,
        pending_actions_generated=pending_actions_count,
    )


@router.get("/sources", summary="Get registered telemetry sources")
def list_sources(db: Database = Depends(get_db)) -> Dict[str, Any]:
    """Returns telemetry data sources and status."""
    sources = db.get_sources()
    return {
        "total_sources": len(sources),
        "sources": sources,
    }


@router.get("/evidence", response_model=EvidenceLedgerResponse, summary="Query evidence ledger and audit integrity")
def list_evidence(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_db),
):
    """
    Fetches the cryptographic evidence chain and audits all records for tamper-evidence.
    Detects any payload alteration, signature forgery, or link breakage.
    """
    total, records = db.get_evidence_records(limit=limit, offset=offset)
    rec_dicts = [r.model_dump() for r in records]
    _, events = db.get_events(limit=500)
    events_map = {e.event_id: e.model_dump() for e in events}
    is_valid, violations = verify_chain_integrity(rec_dicts, events_by_id=events_map)

    tampered_count = len(violations)
    return EvidenceLedgerResponse(
        total_records=total,
        ledger_valid=is_valid,
        tampered_count=tampered_count,
        violations=violations,
        records=records,
    )


@router.post("/scenario/run", summary="Run multi-stage simulated incident scenario")
def run_scenario(
    payload: Optional[Dict[str, Any]] = None,
    db: Database = Depends(get_db),
):
    """
    Runs a safe simulated incident scenario covering:
    1. Suspicious login burst
    2. Network activity egress
    3. Privileged database access
    4. Sensor heartbeat loss
    5. Simulated log tampering
    All generated mitigation actions require human approval.
    """
    body = payload or {}
    target_host = body.get("target_host", "srv-prod-db01")
    target_account = body.get("target_account", "admin")
    scenario_name = body.get("scenario_name", "APT_INTRUSION_AND_TAMPER")

    simulator = ScenarioSimulator(db)
    result = simulator.run_scenario(
        target_host=target_host,
        target_account=target_account,
        scenario_name=scenario_name,
    )
    return result


@router.post("/investigate", response_model=InvestigationResponse, summary="AI multi-agent investigation")
def investigate_incident(
    req: InvestigationRequest,
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
):
    """
    Coordinates Triage, Evidence, and Threat Hunting AI agents to analyze
    incident telemetry, check cryptographic integrity, and formulate containment plans.
    """
    report = orchestrator.investigate(req)
    return report


@router.post("/voice/query", response_model=VoiceQueryResponse, summary="Natural language voice and text query")
def voice_query(
    req: VoiceQueryRequest,
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
):
    """
    Natural language query interface for SOC operators.
    Provides speech synthesis text alongside structured query payload.
    """
    if not req.query_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="query_text cannot be empty")
    return orchestrator.process_voice_query(req)


@router.post("/actions/approve", response_model=ActionDecisionResponse, summary="Human approval for simulated response actions")
def approve_action(
    req: ActionDecisionRequest,
    db: Database = Depends(get_db),
):
    """
    Enforces human approval requirement for simulated response actions.
    Operators review proposed action and submit an approval or rejection decision.
    """
    action = db.get_action_by_id(req.action_id)
    if not action:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action with ID '{req.action_id}' not found.",
        )

    if action.status != ActionStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Action is in '{action.status.value}' state and cannot be decided again.",
        )

    decision_norm = req.decision.strip().lower()
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    if decision_norm == "approve":
        action.status = ActionStatus.EXECUTED_SIMULATED
        action.approver = req.approver
        action.decision_at = now_iso
        action.justification = req.justification or "Approved by operator"
        action.simulated_execution_log = (
            f"[SIMULATED SAFE EXECUTION] {now_iso} - Action '{action.action_type}' simulated on target '{action.target_entity}' "
            f"for host '{action.target_host}'. Zero real system changes made."
        )
        msg = f"Action '{req.action_id}' approved and safely simulated."

    elif decision_norm == "reject":
        action.status = ActionStatus.REJECTED
        action.approver = req.approver
        action.decision_at = now_iso
        action.justification = req.justification or "Rejected by operator"
        action.simulated_execution_log = f"[REJECTED] {now_iso} - Action rejected by operator {req.approver}."
        msg = f"Action '{req.action_id}' rejected by operator."

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decision must be either 'approve' or 'reject'.",
        )

    db.update_action(action)
    return ActionDecisionResponse(
        status="success",
        message=msg,
        action=action,
    )


@router.get("/actions", response_model=ActionListResponse, summary="List all response actions")
def list_actions(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: PENDING_APPROVAL, EXECUTED_SIMULATED, REJECTED"),
    limit: int = Query(50, ge=1, le=200),
    db: Database = Depends(get_db),
):
    """Retrieve simulated response actions and their approval statuses."""
    actions = db.get_actions(status=status_filter, limit=limit)
    pending_count = len([a for a in actions if a.status == ActionStatus.PENDING_APPROVAL])
    return ActionListResponse(
        total=len(actions),
        pending_count=pending_count,
        actions=actions,
    )
