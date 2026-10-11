import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from .action import SimulatedAction


def default_investigation_id() -> str:
    return f"inv-{uuid.uuid4().hex[:8]}"


def default_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class InvestigationRequest(BaseModel):
    """Request payload to initiate AI multi-agent investigation."""
    query: Optional[str] = Field(default=None, description="Natural language prompt or query regarding an incident")
    incident_id: Optional[str] = Field(default=None, description="Optional incident or correlation cluster identifier")
    event_ids: Optional[List[str]] = Field(default=None, description="List of specific event IDs to investigate")
    focus: Optional[str] = Field(default="all", description="Investigation focus: 'all', 'triage', 'evidence', 'threat_hunting'")


class InvestigationFinding(BaseModel):
    """Specific finding synthesized by an AI subagent."""
    agent: str = Field(..., description="Agent name: TriageAgent, EvidenceAgent, or ThreatHunterAgent")
    verdict: str
    confidence: float
    details: Dict[str, Any] = Field(default_factory=dict)


class InvestigationResponse(BaseModel):
    """Comprehensive multi-agent investigation report."""
    investigation_id: str = Field(default_factory=default_investigation_id)
    timestamp: str = Field(default_factory=default_iso_now)
    query: Optional[str] = None
    summary: str
    confidence_score: float
    correlated_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    mitre_tactics: List[str] = Field(default_factory=list)
    evidence_verdict: str = Field(..., description="Cryptographic authenticity: VERIFIED or TAMPER_DETECTED")
    findings: List[InvestigationFinding] = Field(default_factory=list)
    recommended_actions: List[SimulatedAction] = Field(default_factory=list)
