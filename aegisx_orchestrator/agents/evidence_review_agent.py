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

        ev_map[ev.event_id] = rec.model_dump()

        if rec.verification_status == VerificationStatus.TAMPERED:
            tampered.append(ev.event_id)
            uncertainty.append(
                f"Event {ev.event_id} EVIDENCE TAMPERED — "
                f"hash mismatch. Contents must NOT be trusted. "
                f"Verifier note: {rec.verifier_note or 'none'}"
            )
        elif rec.verification_status == VerificationStatus.MISSING:
            missing.append(ev.event_id)
            uncertainty.append(
                f"Event {ev.event_id} marked MISSING by Person 2's verifier."
            )
        elif rec.verification_status == VerificationStatus.UNVERIFIABLE:
            unverifiable.append(ev.event_id)
            uncertainty.append(
                f"Event {ev.event_id} UNVERIFIABLE — "
                f"{rec.verifier_note or 'no detail provided'}."
            )
        else:
            verified.append(ev.event_id)

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
