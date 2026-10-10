import hashlib
import hmac
from evidence_engine.canonical import canonicalize_event


def compute_event_hash(event: dict) -> str:
    """Return the SHA-256 fingerprint of an event."""
    event_bytes = canonicalize_event(event)
    return hashlib.sha256(event_bytes).hexdigest()


def verify_event_hash(event: dict, expected_hash: str) -> bool:
    """Check whether an event matches its previously recorded hash."""
    actual_hash = compute_event_hash(event)
    return hmac.compare_digest(actual_hash, expected_hash)
