from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class EvidenceRecord(BaseModel):
    """A tamper-evident cryptographic evidence block in the ledger."""
    evidence_id: str = Field(..., description="Unique ID for this evidence block")
    event_id: str = Field(..., description="Associated event ID")
    canonical_hash: str = Field(..., description="SHA-256 hash of the canonicalized event payload")
    signature: str = Field(..., description="HMAC-SHA256 signature for the canonical hash")
    previous_hash: str = Field(..., description="Hash of preceding block in the cryptographic chain")
    chain_hash: str = Field(..., description="Combined SHA-256 block hash linking this block to previous")
    timestamp: str = Field(..., description="Timestamp of when the evidence block was sealed")
    integrity_status: str = Field(default="VERIFIED", description="VERIFIED or TAMPERED")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata including source, collector, or notes")


class EvidenceLedgerResponse(BaseModel):
    """Response representing the full or queried evidence ledger status."""
    total_records: int
    ledger_valid: bool
    tampered_count: int
    violations: List[Dict[str, Any]] = Field(default_factory=list)
    records: List[EvidenceRecord]
