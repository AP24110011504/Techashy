from datetime import datetime, timezone
from enum import Enum
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ActionStatus(str, Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXECUTED_SIMULATED = "EXECUTED_SIMULATED"


def default_action_id() -> str:
    return f"act-{uuid.uuid4().hex[:8]}"


def default_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class SimulatedAction(BaseModel):
    """A simulated containment or mitigation action requiring human approval."""
    action_id: str = Field(default_factory=default_action_id)
    created_at: str = Field(default_factory=default_iso_now)
    rule_id: str
    target_host: str
    target_entity: str
    action_type: str = Field(..., description="e.g. ISOLATE_HOST, REVOKE_CREDENTIALS, BLOCK_IP, RESTART_EDR_SENSOR")
    description: str
    risk_level: str = "medium"  # low, medium, high
    status: ActionStatus = ActionStatus.PENDING_APPROVAL
    approver: Optional[str] = None
    decision_at: Optional[str] = None
    justification: Optional[str] = None
    simulated_execution_log: Optional[str] = None


class ActionDecisionRequest(BaseModel):
    """Operator submission to approve or reject a proposed response action."""
    action_id: str
    decision: str = Field(..., description="'approve' or 'reject'")
    approver: str = Field(..., description="Identity or email of approving human operator")
    justification: Optional[str] = Field(default="Standard SOC incident containment", description="Operational rationale")


class ActionDecisionResponse(BaseModel):
    """Result of the approval workflow."""
    status: str
    message: str
    action: SimulatedAction


class ActionListResponse(BaseModel):
    """List of all response actions."""
    total: int
    pending_count: int
    actions: List[SimulatedAction]
