"""
Integration tests for the complete AEGISX Sentinel backend workflow.
Tests the FastAPI application entry point, multi-agent orchestrator,
cryptographic evidence engine, rule detector, and containment approval.
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from main import app
from evidence_engine.integrity import compute_event_hash
from evidence_engine.signatures import generate_key_pair, sign_event


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


def test_root_health_check(client):
    """Test root endpoint returns healthy status and endpoint catalog."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "AEGISX Sentinel" in data["service"]


def test_full_pipeline_clean_verified_evidence(client):
    """
    Test complete flow with verified evidence:
    Event generation -> Real SHA-256 / Ed25519 crypto -> Orchestration -> API response.
    """
    incident_id = "INC-INT-001"
    private_key, public_key = generate_key_pair()

    event_data = {
        "event_id": "EVT-AUTH-001",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "auth_failure",
        "severity": "medium",
        "source_ip": "198.51.100.15",
        "user": "developer",
        "host": "bastion-host",
        "description": "Failed authentication attempt",
    }

    # Generate real SHA-256 hash and Ed25519 signature
    sha256_hash = compute_event_hash(event_data)
    signature_bytes = sign_event(event_data, private_key)

    payload = {
        "incident_id": incident_id,
        "requester": "integration-suite",
        "events": [
            {
                "event_id": event_data["event_id"],
                "timestamp": event_data["timestamp"],
                "event_type": event_data["event_type"],
                "severity": event_data["severity"],
                "source_ip": event_data["source_ip"],
                "user": event_data["user"],
                "host": event_data["host"],
                "description": event_data["description"],
                "fast_detector_flag": False,
            }
        ],
        "evidence": [
            {
                "evidence_id": "EVI-001",
                "event_id": event_data["event_id"],
                "sha256_hash": sha256_hash,
                "expected_hash": sha256_hash,
                "signature_valid": True,
                "verification_status": "verified",
                "verified_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    response = client.post("/api/investigate", json=payload)
    assert response.status_code == 200
    report = response.json()

    assert report["incident_id"] == incident_id
    assert len(report["timeline"]) == 1
    assert report["timeline"][0]["verification_status"] == "verified"
    assert "DetectionAgent" in report["agent_trace"][0]

    # Verify cached retrieval via query endpoints
    events_res = client.get(f"/api/events/{incident_id}")
    assert events_res.status_code == 200
    assert len(events_res.json()["events"]) == 1

    sources_res = client.get(f"/api/sources/{incident_id}")
    assert sources_res.status_code == 200
    assert sources_res.json()["verified_events"] == 1
    assert sources_res.json()["source_health"] == "healthy"


def test_full_pipeline_tampered_evidence(client):
    """
    Test complete flow when evidence has been tampered with:
    Verifies that the orchestrator detects tampering, sets finding confidence to 0%,
    and flags critical uncertainty notes.
    """
    incident_id = "INC-INT-TAMPER"

    payload = {
        "incident_id": incident_id,
        "requester": "tamper-check",
        "events": [
            {
                "event_id": "EVT-TAMPER-01",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "log_tampering",
                "severity": "critical",
                "source_ip": "203.0.113.10",
                "user": "root",
                "host": "database-01",
                "description": "Log entry modified",
            }
        ],
        "evidence": [
            {
                "evidence_id": "EVI-TAMPER-01",
                "event_id": "EVT-TAMPER-01",
                "sha256_hash": "deadbeef" * 8,
                "expected_hash": "cafebabe" * 8,
                "signature_valid": False,
                "verification_status": "tampered",
                "verifier_note": "SHA-256 mismatch detected by Person 2 integrity engine",
                "verified_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    response = client.post("/api/investigate", json=payload)
    assert response.status_code == 200
    report = response.json()

    # Tampering must be detected and surfaced
    assert report["timeline"][0]["verification_status"] == "tampered"
    tampered_findings = [f for f in report["findings"] if "tampering" in f["title"].lower()]
    assert len(tampered_findings) >= 1
    assert tampered_findings[0]["confidence"] == 0.0

    # Increase log verbosity should be recommended
    action_types = [a["action"] for a in report["recommended_actions"]]
    assert "increase_log_verbosity" in action_types


def test_full_pipeline_missing_evidence(client):
    """
    Test complete flow when an event arrives with NO cryptographic evidence record:
    Verifies that missing evidence is treated with high uncertainty and low confidence.
    """
    incident_id = "INC-INT-MISSING"

    payload = {
        "incident_id": incident_id,
        "requester": "audit-runner",
        "events": [
            {
                "event_id": "EVT-UNVERIFIED-99",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "privilege_escalation",
                "severity": "high",
                "source_ip": "10.0.0.50",
                "user": "intern",
                "host": "srv-prod",
                "description": "Privilege escalation without evidence",
            }
        ],
        "evidence": [],  # No evidence record submitted
    }

    response = client.post("/api/investigate", json=payload)
    assert response.status_code == 200
    report = response.json()

    assert report["timeline"][0]["verification_status"] == "missing"
    missing_findings = [f for f in report["findings"] if "missing evidence" in f["title"].lower()]
    assert len(missing_findings) >= 1
    assert missing_findings[0]["is_uncertain"] is True


def test_containment_action_approval_workflow(client):
    """Test approving a simulated containment action with mandatory human oversight."""
    payload = {
        "incident_id": "INC-INT-001",
        "action": "block_ip",
        "target": "198.51.100.15",
        "approved_by": "security-analyst",
        "justification": "Identified as source of unauthorized access",
    }

    response = client.post("/api/actions/approve", json=payload)
    assert response.status_code == 200
    res_data = response.json()

    assert res_data["status"] == "executed"
    assert res_data["action"] == "block_ip"
    assert "SIMULATED ACTION" in res_data["simulation_note"]


def test_containment_action_invalid_rejected(client):
    """Test that unauthorized containment actions are rejected safely with HTTP 422/400."""
    payload = {
        "incident_id": "INC-INT-001",
        "action": "format_hard_drive",  # Not on allow-list
        "target": "server-01",
        "approved_by": "unknown",
        "justification": "test",
    }

    response = client.post("/api/actions/approve", json=payload)
    assert response.status_code in (400, 422)


def test_mismatched_hashes_deceptively_marked_verified_is_detected_as_tampered(client):
    """
    Regression test for the confirmed bug:
    Client supplies sha256_hash != expected_hash but claims verification_status="verified".
    The backend must independently detect the mismatch and report:
      - timeline entry verification_status: "tampered"
      - tampered_events: 1
      - verified_events: 0
      - source_health: "compromised"
    """
    incident_id = "INC-REGRESSION-TAMPER"

    payload = {
        "incident_id": incident_id,
        "requester": "deceptive-client",
        "events": [
            {
                "event_id": "EVT-DECEPTIVE-01",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "auth_failure",
                "severity": "high",
                "source_ip": "203.0.113.100",
                "user": "admin",
                "host": "auth-srv",
                "description": "Failed login attempt",
            }
        ],
        "evidence": [
            {
                "evidence_id": "EVI-DECEPTIVE-01",
                "event_id": "EVT-DECEPTIVE-01",
                "sha256_hash": "a" * 64,
                "expected_hash": "b" * 64,  # Mismatched!
                "signature_valid": True,
                "verification_status": "verified",  # Deceptive client-supplied status!
                "verified_at": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }

    response = client.post("/api/investigate", json=payload)
    assert response.status_code == 200
    report = response.json()

    # Must be independently detected as tampered
    assert report["timeline"][0]["verification_status"] == "tampered"
    tampered_findings = [f for f in report["findings"] if "tampering" in f["title"].lower()]
    assert len(tampered_findings) >= 1
    assert tampered_findings[0]["confidence"] == 0.0

    # Query GET /api/sources/{incident_id}
    sources_res = client.get(f"/api/sources/{incident_id}")
    assert sources_res.status_code == 200
    sources_data = sources_res.json()
    assert sources_data["tampered_events"] == 1
    assert sources_data["verified_events"] == 0
    assert sources_data["source_health"] == "compromised"
