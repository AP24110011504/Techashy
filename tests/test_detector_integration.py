from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from aegisx_orchestrator.models import (
    EventType,
    InvestigationRequest,
    SecurityEvent,
    Severity,
)
from aegisx_orchestrator.orchestrator import run_investigation
from detection.adapter import adapt_and_detect
T0 = datetime(2026, 10, 10, 10, 0, tzinfo=timezone.utc)
def make_failed_login(event_id: str, offset: int) -> SecurityEvent:
    return SecurityEvent(
        event_id=event_id,
        timestamp=T0 + timedelta(seconds=offset),
        event_type=EventType.AUTH_FAILURE,
        severity=Severity.MEDIUM,
        source_ip="203.0.113.42",
        user="admin",
        host="auth-server",
        description="Failed login",
    )
def test_adapter_detects_failed_login_burst():
    events = [
        make_failed_login(f"LOGIN-{i}", i * 10)
        for i in range(5)
    ]
    findings = adapt_and_detect(events, now="2026-10-10T10:01:00Z")
    assert len(findings) == 1
    finding = findings[0]
    assert finding.rule_id == "AUTH_FAILED_LOGIN_BURST"
    assert finding.severity == "high"
    assert set(finding.event_ids) == {
        "LOGIN-0", "LOGIN-1", "LOGIN-2", "LOGIN-3", "LOGIN-4"
    }
    assert finding.detected_at == T0.replace(minute=1)
def test_adapter_skips_failed_logins_without_grouping_fields():
    event = SecurityEvent(
        event_id="NO-SOURCE",
        timestamp=T0,
        event_type=EventType.AUTH_FAILURE,
        severity=Severity.MEDIUM,
        user="admin",
        description="Failed login without source IP",
    )
    assert adapt_and_detect([event]) == []
def test_adapter_returns_empty_for_empty_input():
    assert adapt_and_detect([]) == []
def test_orchestrator_includes_detector_findings_in_report():
    events = [
        make_failed_login(f"BURST-{i}", i * 5)
        for i in range(5)
    ]
    request = InvestigationRequest(
        incident_id="INC-DETECTOR-001",
        events=events,
    )
    report = run_investigation(request)
    assert report.incident_id == "INC-DETECTOR-001"
    assert len(report.detector_findings) == 1
    assert report.detector_findings[0].rule_id == "AUTH_FAILED_LOGIN_BURST"
    assert "BURST-0" in report.detector_findings[0].event_ids
    assert all(event.fast_detector_flag is True for event in events)
def test_orchestrator_survives_rule_detector_failure():
    request = InvestigationRequest(
        incident_id="INC-DETECTOR-FAILURE",
        events=[make_failed_login("FAIL-1", 0)],
    )
    with patch(
        "aegisx_orchestrator.orchestrator.adapt_and_detect",
        side_effect=RuntimeError("detector test failure"),
    ):
        report = run_investigation(request)
    assert report.incident_id == "INC-DETECTOR-FAILURE"
    assert report.detector_findings == []
    assert any("RuleDetector FAILED" in item for item in report.agent_trace)
    assert any(
        "Rule-based detector failed" in item
        for item in report.uncertainty
    )
