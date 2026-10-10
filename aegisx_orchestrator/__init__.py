"""
aegisx_orchestrator – public API surface.

Team lead imports:
    from aegisx_orchestrator import run_investigation
    from aegisx_orchestrator.models import InvestigationRequest, InvestigationReport
"""

from .orchestrator import run_investigation
from .models import (
    InvestigationRequest,
    InvestigationReport,
    SecurityEvent,
    EvidenceRecord,
    ActionApprovalRequest,
    ActionApprovalResponse,
    ContainmentAction,
)

__all__ = [
    "run_investigation",
    "InvestigationRequest",
    "InvestigationReport",
    "SecurityEvent",
    "EvidenceRecord",
    "ActionApprovalRequest",
    "ActionApprovalResponse",
    "ContainmentAction",
]
