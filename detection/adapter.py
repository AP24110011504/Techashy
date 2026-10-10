
"""Adapter between AEGISX orchestration events and the local rule detector."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from aegisx_orchestrator.models import DetectorFinding, SecurityEvent

from .detector import detect_events


def adapt_and_detect(
    events: list[SecurityEvent],
    now: datetime | str | None = None,
) -> list[DetectorFinding]:
    """Run supported deterministic rules and preserve their original results."""
    detector_events: list[dict[str, Any]] = []

    for event in events:
        if event.event_type.value != "auth_failure":
            continue

        # The failed-login rule requires both grouping fields.
        if not event.source_ip or not event.user:
            continue

        detector_events.append({
            "event_id": event.event_id,
            "timestamp": event.timestamp.isoformat(),
            "event_type": "login_failed",
            "source": event.source_ip,
            "account": event.user,
        })

    findings = detect_events(detector_events, now=now)

    return [
        DetectorFinding(
            rule_id=finding["rule_id"],
            severity=finding["severity"],
            explanation=finding["explanation"],
            event_ids=finding["event_ids"],
            detected_at=finding["detected_at"],
        )
        for finding in findings
    ]
