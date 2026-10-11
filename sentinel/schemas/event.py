from datetime import datetime, timezone
from enum import Enum
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class SeverityEnum(str, Enum):
    info = "info"
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


def default_iso_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def default_uuid() -> str:
    return f"evt-{uuid.uuid4().hex[:12]}"


class EventCreate(BaseModel):
    """Schema for incoming event ingestion."""
    event_id: str = Field(default_factory=default_uuid, description="Unique identifier for the event")
    timestamp: str = Field(default_factory=default_iso_now, description="ISO-8601 timestamp in UTC")
    source: str = Field(..., description="Reporting agent, service, or collector source")
    event_type: str = Field(..., description="Normalized event type (e.g., login_failed, edr_heartbeat, database_activity)")
    severity: SeverityEnum = Field(default=SeverityEnum.info, description="Event severity level")
    host: str = Field(..., description="Target hostname or IP address")
    message: str = Field(..., description="Human-readable summary of the security event")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Arbitrary context or raw telemetry payload")
    hash: Optional[str] = Field(default=None, description="SHA-256 canonical hash of the event contents")
    signature: Optional[str] = Field(default=None, description="HMAC-SHA256 signature for tamper-evidence")
    
    # Extended context fields used by detection engine rules
    account: Optional[str] = Field(default=None, description="Target user account for authentication events")
    principal: Optional[str] = Field(default=None, description="Actor principal performing actions")
    endpoint: Optional[str] = Field(default=None, description="Monitored endpoint for EDR heartbeat telemetry")

    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Timestamp must be a string")
        # Ensure it can be parsed as ISO-8601
        try:
            cleaned = v.replace("Z", "+00:00")
            parsed = datetime.fromisoformat(cleaned)
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        except Exception as e:
            raise ValueError(f"Invalid ISO-8601 timestamp: {v}") from e

    def to_detector_dict(self) -> Dict[str, Any]:
        """Convert to dictionary matching the teammate's detector.py expectations."""
        d = self.model_dump()
        # Fallback fields from payload if top-level fields are missing
        if not d.get("account") and "account" in self.payload:
            d["account"] = self.payload["account"]
        if not d.get("principal") and "principal" in self.payload:
            d["principal"] = self.payload["principal"]
        if not d.get("endpoint") and "endpoint" in self.payload:
            d["endpoint"] = self.payload["endpoint"]
        return d


class EventModel(EventCreate):
    """Schema for fully stored event record with computed cryptographic hash and signature."""
    pass


class EventBatch(BaseModel):
    """Batch ingestion payload."""
    events: List[EventCreate]


class EventListResponse(BaseModel):
    """Paginated event query response."""
    total: int
    limit: int
    offset: int
    events: List[EventModel]


class EventIngestResponse(BaseModel):
    """Response after ingesting events."""
    status: str = "success"
    ingested_count: int
    events: List[EventModel]
    findings: List[Dict[str, Any]] = Field(default_factory=list)
    pending_actions_generated: int = 0
