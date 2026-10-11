"""
AEGISX Sentinel – Shared data models.

These Pydantic models define the interface between:
  - Team lead's FastAPI endpoints (POST /api/investigate, GET /api/events, ...)
  - Person 2's crypto/evidence module
  - Person 3's orchestrator and MCP server

Rules:
  - Never fabricate verification_status, sha256_hash, or signature_valid.
  - Unknown / conflicting evidence is always represented explicitly.
  - raw_log is treated as untrusted data — never passed to an LLM.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH     = "high"
    MEDIUM   = "medium"
    LOW      = "low"
    INFO     = "info"


class EventType(str, Enum):
    AUTH_FAILURE        = "auth_failure"
    AUTH_SUCCESS        = "auth_success"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    LATERAL_MOVEMENT    = "lateral_movement"
    DATA_EXFILTRATION   = "data_exfiltration"
    MALWARE_DETECTION   = "malware_detection"
    LOG_TAMPERING       = "log_tampering"
    NETWORK_SCAN        = "network_scan"
    PROCESS_ANOMALY     = "process_anomaly"
    UNKNOWN             = "unknown"


class VerificationStatus(str, Enum):
    VERIFIED     = "verified"       # SHA-256 / signature passed
    TAMPERED     = "tampered"       # Hash mismatch
    MISSING      = "missing"        # No evidence record for this event
    UNVERIFIABLE = "unverifiable"   # Verification could not run


class ActionStatus(str, Enum):
    PENDING  = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTED = "executed"


class ContainmentAction(str, Enum):
    """Explicit allow-list. Nothing outside this enum can be approved."""
    BLOCK_IP                = "block_ip"
    DISABLE_ACCOUNT         = "disable_account"         # simulated
    ISOLATE_ENDPOINT        = "isolate_endpoint"        # simulated
    REVOKE_SESSION          = "revoke_session"
    ALERT_TEAM              = "alert_team"
    INCREASE_LOG_VERBOSITY  = "increase_log_verbosity"


# ---------------------------------------------------------------------------
# Input models
# ---------------------------------------------------------------------------

class SecurityEvent(BaseModel):
    """A single raw security event from any source."""
    event_id:            str            = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp:           datetime
    event_type:          EventType
    severity:            Severity
    source_ip:           Optional[str]  = None
    destination_ip:      Optional[str]  = None
    user:                Optional[str]  = None
    host:                Optional[str]  = None
    description:         str
    raw_log:             Optional[str]  = None  # UNTRUSTED — never pass to LLM
    fast_detector_flag:  Optional[bool] = None  # from Person 1 edge model
    fast_detector_score: Optional[float]= None  # 0.0–1.0 confidence


class EvidenceRecord(BaseModel):
    """
    Cryptographic verification result from Person 2's module.
    The orchestrator MUST NOT fabricate any of these fields.
    """
    evidence_id:         str                    = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id:            str                    # links to SecurityEvent.event_id
    sha256_hash:         Optional[str]          = None
    expected_hash:       Optional[str]          = None
    signature_valid:     Optional[bool]         = None
    verification_status: VerificationStatus
    verified_at:         Optional[datetime]     = None
    verifier_note:       Optional[str]          = None


class InvestigationRequest(BaseModel):
    """POST /api/investigate  request body."""
    incident_id:   str            = Field(default_factory=lambda: str(uuid.uuid4()))
    events:        List[SecurityEvent]
    evidence:      List[EvidenceRecord] = Field(default_factory=list)
    requester:     Optional[str]  = None
    context_notes: Optional[str]  = None


# ---------------------------------------------------------------------------
# Output models
# ---------------------------------------------------------------------------

class TimelineEntry(BaseModel):
    timestamp:           datetime
    event_id:            str
    event_type:          EventType
    description:         str
    severity:            Severity
    verification_status: VerificationStatus
    is_conflicting:      bool = False


class Finding(BaseModel):
    """A corroborated finding — must cite event_ids and evidence_ids."""
    finding_id:   str           = Field(default_factory=lambda: str(uuid.uuid4()))
    title:        str
    description:  str
    severity:     Severity
    event_ids:    List[str]     # MUST cite actual event IDs
    evidence_ids: List[str]     # MUST cite actual evidence IDs
    confidence:   float         # 0.0–1.0, deterministically computed
    is_uncertain: bool = False


class DetectorFinding(BaseModel):
    """A deterministic rule-based detector result."""
    rule_id: str
    severity: Severity
    explanation: str
    event_ids: List[str]
    detected_at: datetime
class RecommendedAction(BaseModel):
    action:           ContainmentAction
    rationale:        str
    target:           Optional[str] = None
    requires_approval: bool = True


class InvestigationReport(BaseModel):
    """POST /api/investigate  response body."""
    incident_id:         str
    generated_at:        datetime               = Field(default_factory=datetime.utcnow)
    summary:             str
    timeline:            List[TimelineEntry]
    findings:            List[Finding]
    detector_findings:   List[DetectorFinding] = Field(default_factory=list)
    uncertainty:         List[str]              # explicit unknowns / conflicts
    recommended_actions: List[RecommendedAction]
    llm_augmented:       bool                  = False
    agent_trace:         List[str]              = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Action approval
# ---------------------------------------------------------------------------

class ActionApprovalRequest(BaseModel):
    """POST /api/actions/approve  request body."""
    incident_id:   str
    action:        ContainmentAction
    target:        Optional[str] = None
    approved_by:   str           # human approver identity — required
    justification: str           # required


class ActionApprovalResponse(BaseModel):
    approval_id:     str            = Field(default_factory=lambda: str(uuid.uuid4()))
    incident_id:     str
    action:          ContainmentAction
    status:          ActionStatus
    executed_at:     Optional[datetime] = None
    simulation_note: str = "SIMULATED – no real system change was made"
