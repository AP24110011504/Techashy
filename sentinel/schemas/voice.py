from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class VoiceQueryRequest(BaseModel):
    """Natural language audio or text query from operator."""
    query_text: str = Field(..., description="Transcribed voice utterance or text question")
    session_id: Optional[str] = Field(default=None, description="Optional conversational session ID")


class VoiceQueryResponse(BaseModel):
    """Verbal and structured response for voice synthesis and UI cards."""
    query_text: str
    speech_text: str = Field(..., description="Concise verbal answer optimized for speech synthesis")
    intent: str = Field(..., description="Classified intent (e.g. status_summary, tamper_audit, action_pending, incident_drilldown)")
    entities: Dict[str, Any] = Field(default_factory=dict, description="Extracted parameters (e.g. host, severity, limit)")
    data_payload: Dict[str, Any] = Field(default_factory=dict, description="Structured query results for visual rendering")
