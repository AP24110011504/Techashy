"""
AEGISX Sentinel – Test suite.

All test data is constructed in-code using Pydantic models.
No JSON files, no mock data files — every test works on real objects.

Three investigation scenarios are tested end-to-end:
  1. clean_request     – all evidence verified, full attack chain
  2. tampered_request  – critical events have SHA-256 hash mismatches
  3. missing_request   – events with no evidence records at all

Plus unit tests for each individual agent.

Run:
    python -m pytest tests/ -v
"""

from __future__ import annotations

import sys
import os
from datetime import datetime, timezone, timedelta

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from aegisx_orchestrator.models import (
    ContainmentAction,
    EvidenceRecord,
    EventType,
    InvestigationRequest,
    SecurityEvent,
    Severity,
    VerificationStatus,
)
from aegisx_orchestrator.orchestrator import run_investigation
from aegisx_orchestrator.agents import (
    detection_agent,
    evidence_review_agent,
    investigation_agent,
)


# ============================================================================
# Shared builders  (construct real Pydantic objects — no JSON files)
# ============================================================================

T0 = datetime(2026, 10, 10, 10, 0, 0, tzinfo=timezone.utc)


def _evt(
    event_id: str,
    offset_seconds: int,
    event_type: EventType,
    severity: Severity,
    description: str,
    source_ip: str = "198.51.100.1",
    destination_ip: str | None = None,
    user: str | None = None,
    host: str | None = "host-01",
    fast_detector_flag: bool = True,
    fast_detector_score: float = 0.80,
) -> SecurityEvent:
    return SecurityEvent(
        event_id=event_id,
        timestamp=T0 + timedelta(seconds=offset_seconds),
        event_type=event_type,
        severity=severity,
        source_ip=source_ip,
        destination_ip=destination_ip,
        user=user,
        host=host,
        description=description,
        fast_detector_flag=fast_detector_flag,
        fast_detector_score=fast_detector_score,
    )


def _evi(
    evidence_id: str,
    event_id: str,
    status: VerificationStatus,
    note: str | None = None,
) -> EvidenceRecord:
    """Build an EvidenceRecord.  Hashes only present when VERIFIED."""
    if status == VerificationStatus.VERIFIED:
        sha = "a" * 64
        exp = "a" * 64
        sig = True
    elif status == VerificationStatus.TAMPERED:
        sha = "deadbeef" + "0" * 56
        exp = "a" * 64
        sig = False
    else:
        sha = None
        exp = None
        sig = None

    return EvidenceRecord(
        evidence_id=evidence_id,
        event_id=event_id,
        sha256_hash=sha,
        expected_hash=exp,
        signature_valid=sig,
        verification_status=status,
        verified_at=T0,
        verifier_note=note,
    )


# ── Scenario A: all verified, full credential-stuffing → escalation chain ──

def _clean_request() -> InvestigationRequest:
    events = [
        _evt("E01",   0, EventType.AUTH_FAILURE,        Severity.MEDIUM,   "Login failed for admin",           user="admin"),
        _evt("E02",  45, EventType.AUTH_FAILURE,        Severity.MEDIUM,   "Login failed for admin (retry)",   user="admin"),
        _evt("E03", 130, EventType.AUTH_SUCCESS,        Severity.HIGH,     "Login succeeded for admin",        user="admin"),
        _evt("E04", 333, EventType.PRIVILEGE_ESCALATION, Severity.CRITICAL,"Sudo to root on db-server-01",     user="admin",  host="db-01"),
        _evt("E05", 495, EventType.DATA_EXFILTRATION,   Severity.CRITICAL, "2.4 GB outbound to external IP",   user="root",   host="db-01"),
    ]
    evidence = [
        _evi("EV01", "E01", VerificationStatus.VERIFIED),
        _evi("EV02", "E02", VerificationStatus.VERIFIED),
        _evi("EV03", "E03", VerificationStatus.VERIFIED),
        _evi("EV04", "E04", VerificationStatus.VERIFIED),
        _evi("EV05", "E05", VerificationStatus.VERIFIED),
    ]
    return InvestigationRequest(
        incident_id="INC-CLEAN-001",
        events=events,
        evidence=evidence,
        requester="test-suite",
    )


# ── Scenario B: tampered evidence on critical events ──

def _tampered_request() -> InvestigationRequest:
    events = [
        _evt("T01",   0, EventType.MALWARE_DETECTION,   Severity.CRITICAL, "Ransomware signature in memory", host="srv-02"),
        _evt("T02", 202, EventType.LOG_TAMPERING,        Severity.HIGH,     "Audit log truncated to 0 bytes", host="srv-02"),
        _evt("T03", 300, EventType.LATERAL_MOVEMENT,     Severity.HIGH,     "SMB hop to backup server",       host="bkp-01"),
    ]
    evidence = [
        _evi("EV-T01", "T01", VerificationStatus.TAMPERED,
             note="SHA-256 mismatch — stored hash altered"),
        _evi("EV-T02", "T02", VerificationStatus.VERIFIED),
        _evi("EV-T03", "T03", VerificationStatus.TAMPERED,
             note="SHA-256 mismatch — attacker modified entry"),
    ]
    return InvestigationRequest(
        incident_id="INC-TAMPER-002",
        events=events,
        evidence=evidence,
        requester="test-suite",
    )


# ── Scenario C: missing evidence (logs may have been deleted) ──

def _missing_request() -> InvestigationRequest:
    events = [
        _evt("M01",   0, EventType.NETWORK_SCAN,          Severity.MEDIUM,   "Port scan across 500 ports"),
        _evt("M02", 900, EventType.PRIVILEGE_ESCALATION,   Severity.CRITICAL, "SUID exploit on web-server",  user="webuser", host="web-01"),
        _evt("M03", 1320, EventType.PROCESS_ANOMALY,       Severity.HIGH,     "xmrig at 95% CPU",            user="root",    host="web-01"),
    ]
    # Only M01 has evidence; M02 and M03 are missing
    evidence = [
        _evi("EV-M01", "M01", VerificationStatus.VERIFIED),
    ]
    return InvestigationRequest(
        incident_id="INC-MISSING-003",
        events=events,
        evidence=evidence,
        requester="test-suite",
    )


# ============================================================================
# Scenario A — clean investigation
# ============================================================================

class TestCleanInvestigation:

    @pytest.fixture(autouse=True)
    def _run(self):
        self.req    = _clean_request()
        self.report = run_investigation(self.req)

    def test_incident_id_preserved(self):
        assert self.report.incident_id == "INC-CLEAN-001"

    def test_timeline_chronological(self):
        ts = [e.timestamp for e in self.report.timeline]
        assert ts == sorted(ts), "Timeline must be chronological"

    def test_all_events_in_timeline(self):
        ids_in = {e.event_id for e in self.req.events}
        ids_out = {e.event_id for e in self.report.timeline}
        assert ids_in == ids_out

    def test_all_events_verified_in_timeline(self):
        for entry in self.report.timeline:
            assert entry.verification_status == VerificationStatus.VERIFIED, \
                f"Event {entry.event_id} should be VERIFIED"

    def test_findings_cite_real_event_ids(self):
        valid_ids = {e.event_id for e in self.req.events}
        for f in self.report.findings:
            assert len(f.event_ids) > 0, f"Finding '{f.title}' must cite event IDs"
            for eid in f.event_ids:
                assert eid in valid_ids, f"Cited event {eid} not in request"

    def test_credential_stuffing_chain_detected(self):
        titles = " ".join(f.title.lower() for f in self.report.findings)
        assert "intrusion chain" in titles or "credential" in titles

    def test_block_ip_recommended(self):
        actions = [a.action for a in self.report.recommended_actions]
        assert ContainmentAction.BLOCK_IP in actions

    def test_destructive_actions_require_approval(self):
        for a in self.report.recommended_actions:
            if a.action != ContainmentAction.ALERT_TEAM:
                assert a.requires_approval is True, \
                    f"{a.action.value} must require human approval"

    def test_no_tamper_uncertainty_in_clean_scenario(self):
        for note in self.report.uncertainty:
            assert "tampered" not in note.lower()

    def test_agent_trace_has_all_steps(self):
        # Steps 1, 2, 3, 4 should all appear
        trace_text = " ".join(self.report.agent_trace)
        for step in ("[1]", "[2]", "[3]", "[4]"):
            assert step in trace_text, f"Step {step} missing from agent trace"

    def test_summary_non_empty(self):
        assert len(self.report.summary) > 20

    def test_conflict_detected_brute_force(self):
        # auth failure → success from same IP within 5 minutes is a conflict
        conflict_notes = [n for n in self.report.uncertainty if "CONFLICT" in n]
        assert len(conflict_notes) > 0, \
            "Credential-stuffing conflict (fail→success same IP) should be flagged"


# ============================================================================
# Scenario B — tampered evidence
# ============================================================================

class TestTamperedEvidence:

    @pytest.fixture(autouse=True)
    def _run(self):
        self.req    = _tampered_request()
        self.report = run_investigation(self.req)

    def test_two_tampered_in_timeline(self):
        tampered = [e for e in self.report.timeline
                    if e.verification_status == VerificationStatus.TAMPERED]
        assert len(tampered) == 2

    def test_tampered_finding_exists(self):
        titles = [f.title.lower() for f in self.report.findings]
        assert any("tamper" in t for t in titles)

    def test_tampered_finding_zero_confidence(self):
        for f in self.report.findings:
            if "tamper" in f.title.lower():
                assert f.confidence == 0.0
                assert f.is_uncertain is True

    def test_uncertainty_mentions_tampered(self):
        combined = " ".join(self.report.uncertainty).lower()
        assert "tampered" in combined or "hash mismatch" in combined

    def test_tampered_events_are_conflicting(self):
        tampered = [e for e in self.report.timeline
                    if e.verification_status == VerificationStatus.TAMPERED]
        for entry in tampered:
            assert entry.is_conflicting is True, \
                f"Tampered event {entry.event_id} must be marked conflicting"

    def test_llm_cannot_change_tampered_status(self):
        # Verification status is set deterministically before any LLM call
        for entry in self.report.timeline:
            if entry.event_id in ("T01", "T03"):
                assert entry.verification_status == VerificationStatus.TAMPERED

    def test_increase_log_verbosity_recommended(self):
        actions = [a.action for a in self.report.recommended_actions]
        assert ContainmentAction.INCREASE_LOG_VERBOSITY in actions


# ============================================================================
# Scenario C — missing evidence
# ============================================================================

class TestMissingEvidence:

    @pytest.fixture(autouse=True)
    def _run(self):
        self.req    = _missing_request()
        self.report = run_investigation(self.req)

    def test_two_missing_in_timeline(self):
        missing = [e for e in self.report.timeline
                   if e.verification_status == VerificationStatus.MISSING]
        assert len(missing) == 2

    def test_missing_finding_exists(self):
        titles = [f.title.lower() for f in self.report.findings]
        assert any("missing" in t for t in titles)

    def test_missing_finding_is_uncertain(self):
        for f in self.report.findings:
            if "missing" in f.title.lower():
                assert f.is_uncertain is True

    def test_missing_finding_low_confidence(self):
        for f in self.report.findings:
            if "missing" in f.title.lower():
                assert f.confidence <= 0.5

    def test_missing_events_cited(self):
        for f in self.report.findings:
            if "missing" in f.title.lower():
                assert "M02" in f.event_ids or "M03" in f.event_ids

    def test_uncertainty_mentions_missing(self):
        combined = " ".join(self.report.uncertainty).lower()
        assert "missing" in combined or "no evidence" in combined or \
               "cannot be confirmed" in combined

    def test_privilege_escalation_no_auth_conflict(self):
        # M02 is privilege escalation with no preceding auth event
        conflict_notes = " ".join(self.report.uncertainty).lower()
        assert "privilege escalation" in conflict_notes or "log deletion" in conflict_notes


# ============================================================================
# Unit: DetectionAgent
# ============================================================================

class TestDetectionAgent:

    def test_flags_high_severity(self):
        req    = _clean_request()
        result = detection_agent.run(req.events)
        assert len(result["flagged_event_ids"]) > 0
        assert result["threat_level"] in ("critical", "high")

    def test_empty_list_returns_low(self):
        result = detection_agent.run([])
        assert result["threat_level"] == "low"
        assert result["flagged_event_ids"] == []

    def test_low_severity_no_flag(self):
        ev     = _evt("X01", 0, EventType.UNKNOWN, Severity.INFO, "routine",
                      fast_detector_flag=False, fast_detector_score=0.1)
        result = detection_agent.run([ev])
        assert "X01" not in result["flagged_event_ids"]

    def test_score_caps_at_one(self):
        # critical + fast_detector + high-risk type would exceed 1.0 without cap
        ev = _evt("X02", 0, EventType.PRIVILEGE_ESCALATION, Severity.CRITICAL,
                  "test", fast_detector_flag=True, fast_detector_score=1.0)
        detection_agent.run([ev])   # must not raise


# ============================================================================
# Unit: EvidenceReviewAgent
# ============================================================================

class TestEvidenceReviewAgent:

    def test_all_verified_no_uncertainty(self):
        req    = _clean_request()
        result = evidence_review_agent.run(req.events, req.evidence)
        assert result["tampered_event_ids"] == []
        assert result["missing_event_ids"]  == []

    def test_detects_tampered(self):
        req    = _tampered_request()
        result = evidence_review_agent.run(req.events, req.evidence)
        assert len(result["tampered_event_ids"]) == 2

    def test_detects_missing(self):
        req    = _missing_request()
        result = evidence_review_agent.run(req.events, req.evidence)
        assert len(result["missing_event_ids"]) == 2

    def test_missing_evidence_is_none_not_fabricated(self):
        """
        When there is no EvidenceRecord for an event the ev_map entry must be
        None — never a fabricated hash.
        """
        req    = _missing_request()
        result = evidence_review_agent.run(req.events, [])  # zero evidence
        for event_id, rec in result["ev_map"].items():
            assert rec is None, \
                f"ev_map[{event_id}] should be None, not a fabricated record"

    def test_uncertainty_notes_non_empty_when_issues(self):
        req    = _tampered_request()
        result = evidence_review_agent.run(req.events, req.evidence)
        assert len(result["uncertainty_notes"]) > 0

    def test_mismatched_hashes_overrides_client_supplied_verified_status(self):
        """Regression test: Mismatched hashes must be classified as tampered,
        even if the client supplied verification_status=VERIFIED and signature_valid=True.
        """
        ev = _evt("E01", 0, EventType.AUTH_FAILURE, Severity.HIGH, "test")
        rec = EvidenceRecord(
            evidence_id="EV01",
            event_id="E01",
            sha256_hash="a" * 64,
            expected_hash="b" * 64,  # mismatch
            signature_valid=True,
            verification_status=VerificationStatus.VERIFIED,  # deceptive status
        )
        result = evidence_review_agent.run([ev], [rec])
        assert "E01" in result["tampered_event_ids"]
        assert "E01" not in result["verified_event_ids"]
        assert result["ev_map"]["E01"]["verification_status"] == VerificationStatus.TAMPERED.value

    def test_matching_hashes_are_verified(self):
        """Test that matching hashes and valid signature are classified as verified."""
        ev = _evt("E02", 0, EventType.AUTH_FAILURE, Severity.HIGH, "test")
        rec = EvidenceRecord(
            evidence_id="EV02",
            event_id="E02",
            sha256_hash="c" * 64,
            expected_hash="c" * 64,  # match
            signature_valid=True,
            verification_status=VerificationStatus.VERIFIED,
        )
        result = evidence_review_agent.run([ev], [rec])
        assert "E02" in result["verified_event_ids"]
        assert result["tampered_event_ids"] == []

    def test_missing_evidence_handled_correctly(self):
        """Test that missing evidence puts the event in missing_event_ids."""
        ev = _evt("E03", 0, EventType.AUTH_FAILURE, Severity.HIGH, "test")
        result = evidence_review_agent.run([ev], [])
        assert "E03" in result["missing_event_ids"]
        assert result["ev_map"]["E03"] is None


# ============================================================================
# Unit: InvestigationAgent
# ============================================================================

class TestInvestigationAgent:

    def _run_all(self, req: InvestigationRequest):
        det = detection_agent.run(req.events)
        ev  = evidence_review_agent.run(req.events, req.evidence)
        return investigation_agent.investigate(req.events, req.evidence, det, ev)

    def test_timeline_sorted(self):
        result = self._run_all(_clean_request())
        ts = [e.timestamp for e in result["timeline"]]
        assert ts == sorted(ts)

    def test_auth_fail_success_conflict_detected(self):
        result = self._run_all(_clean_request())
        assert len(result["conflicts"]) > 0

    def test_no_conflicts_for_single_benign_event(self):
        ev  = _evt("B01", 0, EventType.AUTH_SUCCESS, Severity.INFO,
                   "normal login", fast_detector_flag=False, fast_detector_score=0.1)
        evi = _evi("EV-B01", "B01", VerificationStatus.VERIFIED)
        req = InvestigationRequest(incident_id="INC-BENIGN", events=[ev], evidence=[evi])
        result = self._run_all(req)
        assert result["conflicts"] == []

    def test_tampered_events_get_zero_confidence_finding(self):
        result = self._run_all(_tampered_request())
        tamper_findings = [f for f in result["findings"] if "tamper" in f.title.lower()]
        assert len(tamper_findings) > 0
        assert all(f.confidence == 0.0 for f in tamper_findings)

    def test_missing_events_get_uncertain_finding(self):
        result = self._run_all(_missing_request())
        missing_findings = [f for f in result["findings"] if "missing" in f.title.lower()]
        assert len(missing_findings) > 0
        assert all(f.is_uncertain for f in missing_findings)

    def test_recommended_actions_have_rationale(self):
        result = self._run_all(_clean_request())
        for action in result["recommended_actions"]:
            assert len(action.rationale) > 10, \
                f"Action {action.action.value} has no meaningful rationale"

    def test_privilege_escalation_no_auth_flagged_as_conflict(self):
        """Priv-esc with no preceding auth event must produce a conflict note."""
        result = self._run_all(_missing_request())
        conflict_text = " ".join(c[2] for c in result["conflicts"]).lower()
        assert "privilege escalation" in conflict_text or "log deletion" in conflict_text
