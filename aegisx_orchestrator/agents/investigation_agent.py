"""
Investigation Agent – correlates events, detects conflicts, builds timeline.

Core investigation function is 100% deterministic.
Optional LLM call adds a richer narrative summary ONLY —
it cannot change any verdict fields.

SAFETY:
  - raw_log is NEVER sent to the LLM.
  - event_ids and evidence_ids are always cited in every Finding.
  - Uncertain findings always have is_uncertain=True.
  - Tampered / missing verification_status values are set before the LLM
    is called and are immutable after that point.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from ..models import (
    ContainmentAction,
    EvidenceRecord,
    EventType,
    Finding,
    RecommendedAction,
    SecurityEvent,
    Severity,
    TimelineEntry,
    VerificationStatus,
)

logger = logging.getLogger(__name__)

_SEVERITY_RANK = {
    Severity.CRITICAL: 5,
    Severity.HIGH:     4,
    Severity.MEDIUM:   3,
    Severity.LOW:      2,
    Severity.INFO:     1,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _max_severity(events: List[SecurityEvent]) -> Severity:
    if not events:
        return Severity.INFO
    return max(events, key=lambda e: _SEVERITY_RANK.get(e.severity, 0)).severity


def _confidence(
    event_ids: List[str],
    verified:  set,
    tampered:  set,
    missing:   set,
) -> Tuple[float, bool]:
    """
    Deterministic confidence score:
      verified  → 1.0 per event
      tampered  → 0.0 per event
      missing   → 0.4 per event
      otherwise → 0.5 per event
    Returns (score, is_uncertain).
    """
    if not event_ids:
        return 0.0, True
    scores = []
    for eid in event_ids:
        if eid in tampered:
            scores.append(0.0)
        elif eid in missing:
            scores.append(0.4)
        elif eid in verified:
            scores.append(1.0)
        else:
            scores.append(0.5)
    conf = round(sum(scores) / len(scores), 2)
    uncertain = conf < 0.7 or any(s == 0.0 for s in scores)
    return conf, uncertain


# ---------------------------------------------------------------------------
# Conflict detection
# ---------------------------------------------------------------------------

def _detect_conflicts(
    events:   List[SecurityEvent],
    tampered: set,
    verified: set,
) -> List[Tuple[str, str, str]]:
    """
    Return list of (event_id_a, event_id_b, description) for each conflict:
      1. Auth failure → auth success from same IP within 5 minutes
         (credential stuffing / brute-force success)
      2. CRITICAL/HIGH event with tampered evidence
      3. Privilege escalation that precedes any auth event (timeline gap)
    """
    conflicts: List[Tuple[str, str, str]] = []
    sorted_evs = sorted(events, key=lambda e: e.timestamp)

    # 1 — Auth failure → success same source IP
    last_fail: Dict[str, SecurityEvent] = {}
    for ev in sorted_evs:
        if ev.event_type == EventType.AUTH_FAILURE and ev.source_ip:
            last_fail[ev.source_ip] = ev
        elif ev.event_type == EventType.AUTH_SUCCESS and ev.source_ip:
            prev = last_fail.get(ev.source_ip)
            if prev:
                delta = (ev.timestamp - prev.timestamp).total_seconds()
                if delta < 300:
                    conflicts.append((
                        prev.event_id, ev.event_id,
                        f"Auth failure from {ev.source_ip} (event {prev.event_id}) "
                        f"followed by auth success {delta:.0f}s later "
                        f"(event {ev.event_id}) — possible credential stuffing."
                    ))

    # 2 — Tampered evidence on high-severity events
    for ev in sorted_evs:
        if ev.event_id in tampered and ev.severity in (Severity.HIGH, Severity.CRITICAL):
            conflicts.append((
                ev.event_id, ev.event_id,
                f"Event {ev.event_id} ({ev.event_type.value}, {ev.severity.value}) "
                "has TAMPERED evidence — contents must not be trusted."
            ))

    # 3 — Privilege escalation before any auth
    priv_evs = [e for e in sorted_evs if e.event_type == EventType.PRIVILEGE_ESCALATION]
    auth_evs  = [e for e in sorted_evs if e.event_type in (EventType.AUTH_SUCCESS, EventType.AUTH_FAILURE)]
    if priv_evs and not auth_evs:
        for pev in priv_evs:
            conflicts.append((
                pev.event_id, pev.event_id,
                f"Privilege escalation (event {pev.event_id}) found with no preceding "
                "auth events — possible log deletion or direct access."
            ))
    elif priv_evs and auth_evs:
        first_auth_ts = min(e.timestamp for e in auth_evs)
        for pev in priv_evs:
            if pev.timestamp < first_auth_ts:
                delta = (first_auth_ts - pev.timestamp).total_seconds()
                conflicts.append((
                    pev.event_id, auth_evs[0].event_id,
                    f"Privilege escalation (event {pev.event_id}) precedes earliest "
                    f"auth event by {delta:.0f}s — timeline inconsistency."
                ))

    return conflicts


# ---------------------------------------------------------------------------
# Core investigation — deterministic
# ---------------------------------------------------------------------------

def investigate(
    events:           List[SecurityEvent],
    evidence:         List[EvidenceRecord],
    detection_result: Dict[str, Any],
    evidence_result:  Dict[str, Any],
) -> Dict[str, Any]:
    """
    Main investigation function.

    Returns:
      timeline, findings, conflicts, uncertainty_notes,
      recommended_actions, severity_summary, agent_note
    """
    verified  = set(evidence_result.get("verified_event_ids", []))
    tampered  = set(evidence_result.get("tampered_event_ids", []))
    missing   = set(evidence_result.get("missing_event_ids", []))
    flagged   = set(detection_result.get("flagged_event_ids", []))

    # ── 1. Timeline ──────────────────────────────────────────────────────
    sorted_evs = sorted(events, key=lambda e: e.timestamp)
    timeline: List[TimelineEntry] = []
    for ev in sorted_evs:
        if ev.event_id in tampered:
            vstatus = VerificationStatus.TAMPERED
        elif ev.event_id in missing:
            vstatus = VerificationStatus.MISSING
        elif ev.event_id in verified:
            vstatus = VerificationStatus.VERIFIED
        else:
            vstatus = VerificationStatus.UNVERIFIABLE
        timeline.append(TimelineEntry(
            timestamp=ev.timestamp,
            event_id=ev.event_id,
            event_type=ev.event_type,
            description=ev.description,
            severity=ev.severity,
            verification_status=vstatus,
        ))

    # ── 2. Conflicts ──────────────────────────────────────────────────────
    conflicts = _detect_conflicts(sorted_evs, tampered, verified)
    conflict_ids = {c[0] for c in conflicts} | {c[1] for c in conflicts}
    for entry in timeline:
        if entry.event_id in conflict_ids:
            entry.is_conflicting = True

    # ── 3. Findings ───────────────────────────────────────────────────────
    findings: List[Finding] = []
    ev_map = evidence_result.get("ev_map", {})

    def _evidence_ids_for(eids: List[str]) -> List[str]:
        return [
            ev_map[eid]["evidence_id"]
            for eid in eids
            if ev_map.get(eid)
        ]

    # High-severity flagged events
    hi_ids = [
        e.event_id for e in events
        if e.event_id in flagged
        and e.severity in (Severity.CRITICAL, Severity.HIGH)
    ]
    if hi_ids:
        conf, uncertain = _confidence(hi_ids, verified, tampered, missing)
        findings.append(Finding(
            title="High-severity threat events detected",
            description=(
                f"{len(hi_ids)} event(s) with HIGH or CRITICAL severity flagged "
                f"by the detection agent. Confidence: {conf:.0%}."
            ),
            severity=_max_severity([e for e in events if e.event_id in hi_ids]),
            event_ids=hi_ids,
            evidence_ids=_evidence_ids_for(hi_ids),
            confidence=conf,
            is_uncertain=uncertain,
        ))

    # Tampered evidence
    if tampered:
        findings.append(Finding(
            title="Evidence tampering detected",
            description=(
                f"{len(tampered)} event(s) have SHA-256 hash mismatches. "
                "Attacker may have modified logs. Contents must not be trusted."
            ),
            severity=Severity.CRITICAL,
            event_ids=list(tampered),
            evidence_ids=_evidence_ids_for(list(tampered)),
            confidence=0.0,
            is_uncertain=True,
        ))

    # Missing evidence
    if missing:
        findings.append(Finding(
            title="Missing evidence for events",
            description=(
                f"{len(missing)} event(s) have no cryptographic evidence record. "
                "These cannot be verified and may have been injected or deleted."
            ),
            severity=Severity.HIGH,
            event_ids=list(missing),
            evidence_ids=[],
            confidence=0.3,
            is_uncertain=True,
        ))

    # Auth failure → privilege escalation chain
    auth_fail_evs = [e for e in events if e.event_type == EventType.AUTH_FAILURE]
    priv_esc_evs  = [e for e in events if e.event_type == EventType.PRIVILEGE_ESCALATION]
    if auth_fail_evs and priv_esc_evs:
        chain_ids = [e.event_id for e in auth_fail_evs + priv_esc_evs]
        conf, uncertain = _confidence(chain_ids, verified, tampered, missing)
        findings.append(Finding(
            title="Possible credential-based intrusion chain",
            description=(
                f"Detected {len(auth_fail_evs)} auth failure(s) followed by "
                f"{len(priv_esc_evs)} privilege escalation event(s). "
                "Pattern consistent with credential stuffing or brute-force "
                "followed by privilege abuse."
            ),
            severity=Severity.CRITICAL,
            event_ids=chain_ids,
            evidence_ids=_evidence_ids_for(chain_ids),
            confidence=conf,
            is_uncertain=uncertain,
        ))

    # ── 4. Uncertainty notes ──────────────────────────────────────────────
    uncertainty: List[str] = list(evidence_result.get("uncertainty_notes", []))
    for _, _, desc in conflicts:
        uncertainty.append(f"CONFLICT: {desc}")

    # ── 5. Recommended actions ────────────────────────────────────────────
    actions: List[RecommendedAction] = []

    # Block the most-active attacking IP
    if auth_fail_evs:
        ip_counts: Dict[str, int] = {}
        for ev in auth_fail_evs:
            if ev.source_ip:
                ip_counts[ev.source_ip] = ip_counts.get(ev.source_ip, 0) + 1
        if ip_counts:
            top_ip = max(ip_counts, key=lambda k: ip_counts[k])
            actions.append(RecommendedAction(
                action=ContainmentAction.BLOCK_IP,
                rationale=(
                    f"Source IP {top_ip} produced {ip_counts[top_ip]} auth failure(s). "
                    "Blocking it stops ongoing brute-force attempts."
                ),
                target=top_ip,
                requires_approval=True,
            ))

    # Disable accounts involved in privilege escalation
    affected_users = list({e.user for e in priv_esc_evs if e.user})
    for user in affected_users[:2]:
        actions.append(RecommendedAction(
            action=ContainmentAction.DISABLE_ACCOUNT,
            rationale=(
                f"User '{user}' associated with privilege escalation. "
                "Disabling prevents further misuse."
            ),
            target=user,
            requires_approval=True,
        ))

    # Increase logging if tampering detected
    if tampered:
        actions.append(RecommendedAction(
            action=ContainmentAction.INCREASE_LOG_VERBOSITY,
            rationale=(
                "Evidence tampering detected. Increase verbosity and enable "
                "immutable log shipping to capture future attacker activity."
            ),
            requires_approval=True,
        ))

    # Always alert the team
    actions.append(RecommendedAction(
        action=ContainmentAction.ALERT_TEAM,
        rationale="Notify the security team of this incident for review.",
        requires_approval=False,
    ))

    return {
        "timeline":            timeline,
        "findings":            findings,
        "conflicts":           conflicts,
        "uncertainty_notes":   uncertainty,
        "recommended_actions": actions,
        "severity_summary":    detection_result.get("threat_level", "unknown"),
        "agent_note":          "InvestigationAgent[deterministic]",
    }


# ---------------------------------------------------------------------------
# Optional LLM narrative (Gemini)
# ---------------------------------------------------------------------------

def augment_with_llm(
    findings:         List[Finding],
    timeline:         List[TimelineEntry],
    uncertainty_notes: List[str],
) -> Optional[str]:
    """
    Calls Gemini to produce a richer narrative summary.

    SAFETY:
      - raw_log is NEVER included in the prompt.
      - Only structured fields (event_ids, types, timestamps, severities) are sent.
      - LLM output is used ONLY for the 'summary' narrative string.
      - Verdict fields are immutable; set before this call.
      - Returns None on any failure — caller falls back to deterministic summary.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.info("GEMINI_API_KEY not set — using deterministic summary.")
        return None

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)

        finding_lines = "\n".join(
            f"- [{f.severity.value.upper()}] {f.title} "
            f"(confidence {f.confidence:.0%}, uncertain={f.is_uncertain})"
            for f in findings
        )
        timeline_lines = "\n".join(
            f"  {e.timestamp.isoformat()} | {e.event_type.value} | "
            f"{e.severity.value} | verified={e.verification_status.value}"
            for e in timeline[:10]
        )
        uncertainty_text = "\n".join(f"  - {u}" for u in uncertainty_notes[:5])

        prompt = (
            "You are a cybersecurity analyst. Based on the structured investigation "
            "data below (no raw logs), write a concise 3–5 sentence incident summary "
            "for a security team. Be factual. Do NOT invent event IDs, hashes, "
            "usernames, or IP addresses not present in the data.\n\n"
            f"Findings:\n{finding_lines}\n\n"
            f"Timeline (first 10 events):\n{timeline_lines}\n\n"
            f"Uncertainty notes:\n{uncertainty_text}\n\n"
            "Summary:"
        )

        model    = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as exc:
        logger.warning(f"LLM augmentation failed: {exc}. Using deterministic summary.")
        return None
