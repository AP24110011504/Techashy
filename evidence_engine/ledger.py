"""
evidence_engine.ledger
----------------------
In-memory tamper-evident hash-linked ledger for AEGISX Sentinel.

NOTE: This is an in-memory data structure prototype for evidence verification
and audit integrity. It does NOT connect to any database or provide persistent
disk storage. It is a cryptographic hash chain, not a blockchain.
"""

import hmac
from typing import List, Dict, Any, Tuple

try:
    from evidence_engine.integrity import compute_event_hash
except ImportError:
    from integrity import compute_event_hash

# Clearly defined genesis value for the previous hash of the very first entry
GENESIS_PREV_HASH: str = "0" * 64


def compute_entry_hash(entry_id: int, evidence_hash: str, prev_hash: str) -> str:
    """Deterministically compute the SHA-256 hash of a ledger entry's contents.

    Uses compute_event_hash (which enforces deterministic UTF-8 canonicalization).
    """
    payload = {
        "entry_id": entry_id,
        "evidence_hash": evidence_hash,
        "prev_hash": prev_hash,
    }
    return compute_event_hash(payload)


def create_ledger_entry(entry_id: int, evidence_hash: str, prev_hash: str) -> Dict[str, Any]:
    """Create a new ledger entry dictionary with an entry ID, evidence hash,
    previous entry hash, and calculated current entry hash.
    """
    entry_hash = compute_entry_hash(entry_id, evidence_hash, prev_hash)
    return {
        "entry_id": entry_id,
        "evidence_hash": evidence_hash,
        "prev_hash": prev_hash,
        "entry_hash": entry_hash,
    }


def append_ledger_entry(ledger: List[Dict[str, Any]], evidence_hash: str) -> Dict[str, Any]:
    """Append a new evidence record to an in-memory ledger list.

    Args:
        ledger: The list representing the in-memory ledger.
        evidence_hash: The SHA-256 hash of the evidence event to append.

    Returns:
        dict: The newly created and appended ledger entry.

    Raises:
        TypeError: If ledger is not a list.
        ValueError: If evidence_hash is invalid or previous entry is malformed.
    """
    if not isinstance(ledger, list):
        raise TypeError("ledger must be a list")

    if not isinstance(evidence_hash, str) or len(evidence_hash) != 64:
        raise ValueError("evidence_hash must be a 64-character hexadecimal SHA-256 string")

    if len(ledger) == 0:
        entry_id = 0
        prev_hash = GENESIS_PREV_HASH
    else:
        prev_entry = ledger[-1]
        if not isinstance(prev_entry, dict) or "entry_hash" not in prev_entry:
            raise ValueError("Previous ledger entry is invalid or missing entry_hash")
        entry_id = len(ledger)
        prev_hash = prev_entry["entry_hash"]

    entry = create_ledger_entry(entry_id, evidence_hash, prev_hash)
    ledger.append(entry)
    return entry


def audit_ledger(ledger: List[Dict[str, Any]]) -> Tuple[bool, str]:
    """Audit the integrity of the ledger sequence.

    Checks:
    - Empty ledgers are considered valid.
    - Each entry has all required fields (entry_id, evidence_hash, prev_hash, entry_hash).
    - Sequential entry IDs are strictly ordered (detects reordering or deleted entries).
    - The first entry correctly references GENESIS_PREV_HASH.
    - Subsequent entries reference the exact entry_hash of the previous entry.
    - Each entry's entry_hash matches the recalculated hash of its contents.

    Security Guarantee:
    Does NOT modify, repair, or overwrite any entries when verification fails.

    Returns:
        tuple: (is_valid: bool, reason_message: str)
    """
    if not isinstance(ledger, list):
        return False, "Ledger must be a list"

    if len(ledger) == 0:
        return True, "Ledger is empty and valid"

    for i, entry in enumerate(ledger):
        if not isinstance(entry, dict):
            return False, f"Entry at index {i} is not a dictionary"

        for required_field in ("entry_id", "evidence_hash", "prev_hash", "entry_hash"):
            if required_field not in entry:
                return False, f"Entry at index {i} is missing required field '{required_field}'"

        # Check sequential entry_id (detects reordering or skipped entries)
        if entry["entry_id"] != i:
            return False, f"Entry at index {i} has invalid entry_id {entry['entry_id']} (expected {i})"

        # Check previous hash link
        if i == 0:
            if not hmac.compare_digest(entry["prev_hash"].lower(), GENESIS_PREV_HASH.lower()):
                return False, "Genesis entry prev_hash does not match GENESIS_PREV_HASH"
        else:
            prev_entry = ledger[i - 1]
            if not hmac.compare_digest(entry["prev_hash"].lower(), prev_entry["entry_hash"].lower()):
                return False, f"Broken chain link at index {i}: prev_hash does not match previous entry's hash"

        # Recompute hash to detect modified content or forged entry_hash
        expected_hash = compute_entry_hash(entry["entry_id"], entry["evidence_hash"], entry["prev_hash"])
        if not hmac.compare_digest(entry["entry_hash"].lower(), expected_hash.lower()):
            return False, f"Tampered content at index {i}: entry_hash does not match recalculated hash"

    return True, "Ledger verification passed"


def verify_ledger(ledger: List[Dict[str, Any]]) -> bool:
    """Verify the ledger sequence and return True if valid, False otherwise.

    Does not modify or repair entries upon failure.
    """
    is_valid, _ = audit_ledger(ledger)
    return is_valid


class InMemoryLedger:
    """Convenience wrapper class for managing an in-memory hash-linked ledger.

    NOTE: In-memory prototype only; does not provide database persistence.
    """

    def __init__(self) -> None:
        self.entries: List[Dict[str, Any]] = []

    def append(self, evidence_hash: str) -> Dict[str, Any]:
        """Append an evidence hash to this ledger."""
        return append_ledger_entry(self.entries, evidence_hash)

    def verify(self) -> bool:
        """Verify the integrity of this ledger."""
        return verify_ledger(self.entries)

    def audit(self) -> Tuple[bool, str]:
        """Audit this ledger and return (is_valid, reason)."""
        return audit_ledger(self.entries)

    def __len__(self) -> int:
        return len(self.entries)

    def __getitem__(self, index: int) -> Dict[str, Any]:
        return self.entries[index]
