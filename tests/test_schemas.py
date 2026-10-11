import unittest
from sentinel.crypto.integrity import (
    compute_canonical_event_hash,
    compute_event_signature,
    verify_event_signature,
    compute_chain_hash,
    verify_chain_integrity,
    GENESIS_PREVIOUS_HASH,
)
from sentinel.schemas.event import EventCreate, EventModel, SeverityEnum


class SchemaAndCryptoTests(unittest.TestCase):
    def test_canonical_hash_determinism(self):
        payload_a = {
            "event_id": "test-1",
            "timestamp": "2026-10-10T12:00:00Z",
            "source": "host-1",
            "event_type": "login_failed",
            "severity": "high",
            "host": "srv-01",
            "message": "Auth failed",
            "payload": {"ip": "1.2.3.4", "port": 22},
        }
        payload_b = {
            "message": "Auth failed",
            "payload": {"port": 22, "ip": "1.2.3.4"},
            "host": "srv-01",
            "severity": "high",
            "event_type": "login_failed",
            "source": "host-1",
            "timestamp": "2026-10-10T12:00:00Z",
            "event_id": "test-1",
        }
        hash_a = compute_canonical_event_hash(payload_a)
        hash_b = compute_canonical_event_hash(payload_b)
        self.assertEqual(hash_a, hash_b)
        self.assertEqual(len(hash_a), 64)

    def test_signature_generation_and_verification(self):
        event_hash = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789"
        sig = compute_event_signature(event_hash)
        self.assertTrue(verify_event_signature(event_hash, sig))
        self.assertFalse(verify_event_signature(event_hash, "invalid-sig"))

    def test_event_create_defaults_and_validation(self):
        evt = EventCreate(
            source="edr-01",
            event_type="process_spawn",
            host="workstation-09",
            message="CMD executed",
        )
        self.assertTrue(evt.event_id.startswith("evt-"))
        self.assertTrue(evt.timestamp.endswith("Z"))
        self.assertEqual(evt.severity, SeverityEnum.info)

    def test_chain_integrity_detection_of_tampering(self):
        # Genesis block
        ts1 = "2026-10-10T12:00:00Z"
        h1 = "hash1"
        sig1 = compute_event_signature(h1)
        chain1 = compute_chain_hash(GENESIS_PREVIOUS_HASH, h1, ts1)
        rec1 = {
            "evidence_id": "ev-1",
            "event_id": "evt-1",
            "canonical_hash": h1,
            "signature": sig1,
            "previous_hash": GENESIS_PREVIOUS_HASH,
            "chain_hash": chain1,
            "timestamp": ts1,
        }

        # Block 2
        ts2 = "2026-10-10T12:01:00Z"
        h2 = "hash2"
        sig2 = compute_event_signature(h2)
        chain2 = compute_chain_hash(chain1, h2, ts2)
        rec2 = {
            "evidence_id": "ev-2",
            "event_id": "evt-2",
            "canonical_hash": h2,
            "signature": sig2,
            "previous_hash": chain1,
            "chain_hash": chain2,
            "timestamp": ts2,
        }

        # Valid chain
        is_valid, violations = verify_chain_integrity([rec1, rec2])
        self.assertTrue(is_valid)
        self.assertEqual(violations, [])

        # Tampered Block 2 (e.g. modified hash)
        rec2_tampered = dict(rec2)
        rec2_tampered["canonical_hash"] = "tampered_hash"
        is_valid_tampered, violations_tampered = verify_chain_integrity([rec1, rec2_tampered])
        self.assertFalse(is_valid_tampered)
        self.assertTrue(len(violations_tampered) > 0)


if __name__ == "__main__":
    unittest.main()
