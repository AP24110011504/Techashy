"""
Evidence Review Agent – consumes cryptographic verification results from Person 2.

STRICT CONTRACT:
  - NEVER fabricates sha256_hash, expected_hash, signature_valid, or
    verification_status.
  - All those values come directly from EvidenceRecord objects produced
    by Person 2's module.
  - If no EvidenceRecord exists for an event the status is MISSING (uncertain).
  - The LLM cannot overrule a TAMPERED or MISSING status.
"""

from __future__ import annotations

import hmac
from typing import Any, Dict, List

from ..models import EvidenceRecord, SecurityEvent, VerificationStatus


def run(
    events: List[SecurityEvent],
    evidence: List[EvidenceRecord],
) -> Dict[str, Any]:
    """
    Map evidence records to events and return:
      ev_map, tampered_event_ids, missing_event_ids,
      unverifiable_event_ids, verified_event_ids,
      uncertainty_notes, summary, agent_note
    """
    # Index by event_id — last record wins if duplicates exist
    index: Dict[str, EvidenceRecord] = {rec.event_id: rec for rec in evidence}

    tampered:     List[str] = []
    missing:      List[str] = []
    unverifiable: List[str] = []
    verified:     List[str] = []
    uncertainty:  List[str] = []
    ev_map:       Dict[str, Any] = {}

    for ev in events:
        rec = index.get(ev.event_id)

        if rec is None:
            missing.append(ev.event_id)
            ev_map[ev.event_id] = None
            uncertainty.append(
                f"Event {ev.event_id} ({ev.event_type.value}) has no evidence "
                "record — integrity cannot be confirmed."
            )
            continue

        rec_data = rec.model_dump()

        # Independently verify cryptographic integrity rather than blindly trusting client status
        has_hashes = bool(rec.sha256_hash and rec.expected_hash)
        hashes_match = False
        hash_mismatch = False

        if has_hashes:
            hashes_match = hmac.compare_digest(
                str(rec.sha256_hash).strip().lower(),
                str(rec.expected_hash).strip().lower(),
            )
            hash_mismatch = not hashes_match

        signature_failed = rec.signature_valid is False

        # Treat hash mismatch or failed signature as tampered evidence
        if hash_mismatch or signature_failed or rec.verification_status == VerificationStatus.TAMPERED:
            tampered.append(ev.event_id)
            rec_data["verification_status"] = VerificationStatus.TAMPERED.value
            ev_map[ev.event_id] = rec_data

            if hash_mismatch:
                reason = "SHA-256 hash mismatch between observed and expected hash"
            elif signature_failed:
                reason = "invalid digital signature"
            else:
                reason = rec.verifier_note or "hash mismatch"

            uncertainty.append(
                f"Event {ev.event_id} EVIDENCE TAMPERED — {reason}. "
                "Contents must NOT be trusted."
            )
        elif rec.verification_status == VerificationStatus.MISSING:
            missing.append(ev.event_id)
            ev_map[ev.event_id] = rec_data
            uncertainty.append(
                f"Event {ev.event_id} marked MISSING by Person 2's verifier."
            )
        elif rec.verification_status == VerificationStatus.UNVERIFIABLE or not has_hashes:
            unverifiable.append(ev.event_id)
            rec_data["verification_status"] = VerificationStatus.UNVERIFIABLE.value
            ev_map[ev.event_id] = rec_data
            uncertainty.append(
                f"Event {ev.event_id} UNVERIFIABLE — "
                f"{rec.verifier_note or 'missing hash data for independent verification'}."
            )
        elif hashes_match:
            verified.append(ev.event_id)
            ev_map[ev.event_id] = rec_data
        else:
            unverifiable.append(ev.event_id)
            rec_data["verification_status"] = VerificationStatus.UNVERIFIABLE.value
            ev_map[ev.event_id] = rec_data

    return {
        "ev_map":                ev_map,
        "tampered_event_ids":    tampered,
        "missing_event_ids":     missing,
        "unverifiable_event_ids": unverifiable,
        "verified_event_ids":    verified,
        "uncertainty_notes":     uncertainty,
        "summary": (
            f"EvidenceReviewAgent: {len(verified)} verified, "
            f"{len(tampered)} tampered, {len(missing)} missing, "
            f"{len(unverifiable)} unverifiable "
            f"out of {len(events)} events."
        ),
        "agent_note": "EvidenceReviewAgent[deterministic — no fabrication]",
    }
