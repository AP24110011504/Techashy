"""
Detection Agent – reviews SecurityEvent list and fast-detector flags.

Pure deterministic logic. No LLM. No mock data.
Scores each event and returns a threat summary.
"""

from __future__ import annotations

from typing import Any, Dict, List

from ..models import SecurityEvent, Severity

_HIGH_RISK_TYPES = {
    "privilege_escalation", "lateral_movement",
    "data_exfiltration", "log_tampering", "malware_detection",
}
_SEVERITY_SCORE = {
    Severity.CRITICAL: 1.0,
    Severity.HIGH:     0.8,
    Severity.MEDIUM:   0.5,
    Severity.LOW:      0.2,
    Severity.INFO:     0.05,
}


def run(events: List[SecurityEvent]) -> Dict[str, Any]:
    """
    Score every event and return:
      flagged_event_ids, threat_level, summary, agent_note
    """
    flagged: List[str] = []
    scores:  List[float] = []

    for ev in events:
        score = _SEVERITY_SCORE.get(ev.severity, 0.0)
        if ev.fast_detector_flag is True:
            score += 0.3
        if ev.fast_detector_score is not None:
            score += ev.fast_detector_score * 0.2
        if ev.event_type.value in _HIGH_RISK_TYPES:
            score += 0.2
        score = min(score, 1.0)
        scores.append(score)
        if score >= 0.6:
            flagged.append(ev.event_id)

    overall = max(scores) if scores else 0.0

    if overall >= 0.85:
        level = "critical"
    elif overall >= 0.70:
        level = "high"
    elif overall >= 0.45:
        level = "medium"
    else:
        level = "low"

    return {
        "flagged_event_ids": flagged,
        "threat_level":      level,
        "summary": (
            f"DetectionAgent reviewed {len(events)} event(s). "
            f"{len(flagged)} flagged. Threat level: {level.upper()}."
        ),
        "agent_note": "DetectionAgent[deterministic]",
    }
