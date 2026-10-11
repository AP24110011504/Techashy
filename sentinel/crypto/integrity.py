import hashlib
import hmac
import json
from typing import Any, Dict, List, Optional, Tuple
from sentinel.config import SECRET_KEY

GENESIS_PREVIOUS_HASH = "0" * 64


def canonical_json_dumps(data: Any) -> str:
    """Serializes data into deterministic JSON with sorted keys and compact separators."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=True, default=str)


def compute_canonical_event_hash(event_dict: Dict[str, Any]) -> str:
    """
    Computes deterministic SHA-256 hash across event content.
    Excludes existing 'hash' and 'signature' keys to ensure idempotency.
    """
    keys_to_exclude = {"hash", "signature", "_time"}
    clean_dict = {k: v for k, v in event_dict.items() if k not in keys_to_exclude}
    serialized = canonical_json_dumps(clean_dict)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def compute_event_signature(event_hash: str, secret: Optional[str] = None) -> str:
    """Computes HMAC-SHA256 signature for a canonical event hash using a shared secret."""
    effective_secret = (secret or SECRET_KEY).encode("utf-8")
    return hmac.new(effective_secret, event_hash.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_event_signature(event_hash: str, signature: str, secret: Optional[str] = None) -> bool:
    """Verifies HMAC-SHA256 signature with constant-time comparison to prevent timing attacks."""
    if not signature or not event_hash:
        return False
    expected = compute_event_signature(event_hash, secret)
    return hmac.compare_digest(expected, signature)


def compute_chain_hash(previous_hash: str, current_event_hash: str, timestamp: str) -> str:
    """
    Computes a cryptographic block hash linking the current record to the previous record.
    chain_hash = SHA-256(previous_hash + ":" + current_event_hash + ":" + timestamp)
    """
    message = f"{previous_hash}:{current_event_hash}:{timestamp}"
    return hashlib.sha256(message.encode("utf-8")).hexdigest()


def verify_chain_integrity(
    records: List[Dict[str, Any]],
    events_by_id: Optional[Dict[str, Dict[str, Any]]] = None,
    secret: Optional[str] = None,
) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Audits the complete evidence ledger chain from genesis to head.
    Verifies:
      1. Recalculated event canonical hash matches record canonical hash (if event payload provided).
      2. Signature matches canonical hash.
      3. Previous hash links accurately to preceding record's chain hash.
      4. Chain hash matches SHA-256(previous_hash:canonical_hash:timestamp).
    Returns (is_valid, list_of_violations).
    """
    violations = []
    expected_previous_hash = GENESIS_PREVIOUS_HASH

    for idx, rec in enumerate(records):
        evidence_id = rec.get("evidence_id", f"record-{idx}")
        event_id = rec.get("event_id")
        rec_canonical_hash = rec.get("canonical_hash")
        rec_signature = rec.get("signature")
        rec_prev_hash = rec.get("previous_hash")
        rec_chain_hash = rec.get("chain_hash")
        rec_timestamp = rec.get("timestamp")

        # Check payload tampering against source event if provided
        if events_by_id and event_id in events_by_id:
            raw_event = events_by_id[event_id]
            actual_event_hash = compute_canonical_event_hash(raw_event)
            if actual_event_hash != rec_canonical_hash:
                violations.append({
                    "evidence_id": evidence_id,
                    "event_id": event_id,
                    "index": idx,
                    "reason": "PAYLOAD_TAMPERING_DETECTED",
                    "expected_event_hash": rec_canonical_hash,
                    "actual_recomputed_hash": actual_event_hash,
                })

        # 1. Check link to previous block
        if rec_prev_hash != expected_previous_hash:
            violations.append({
                "evidence_id": evidence_id,
                "event_id": event_id,
                "index": idx,
                "reason": "PREVIOUS_HASH_MISMATCH",
                "expected_previous_hash": expected_previous_hash,
                "actual_previous_hash": rec_prev_hash,
            })

        # 2. Check signature
        if rec_canonical_hash and rec_signature:
            if not verify_event_signature(rec_canonical_hash, rec_signature, secret):
                violations.append({
                    "evidence_id": evidence_id,
                    "event_id": event_id,
                    "index": idx,
                    "reason": "INVALID_SIGNATURE",
                    "canonical_hash": rec_canonical_hash,
                })

        # 3. Check chain hash calculation
        if rec_prev_hash and rec_canonical_hash and rec_timestamp:
            computed_chain = compute_chain_hash(rec_prev_hash, rec_canonical_hash, rec_timestamp)
            if computed_chain != rec_chain_hash:
                violations.append({
                    "evidence_id": evidence_id,
                    "event_id": event_id,
                    "index": idx,
                    "reason": "CHAIN_HASH_MISMATCH",
                    "expected_chain_hash": computed_chain,
                    "actual_chain_hash": rec_chain_hash,
                })

        # Advance expected previous hash to this block's chain hash
        expected_previous_hash = rec_chain_hash or ""

    is_valid = len(violations) == 0
    return is_valid, violations
