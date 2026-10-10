import unittest
from evidence_engine.canonical import canonicalize_event
from evidence_engine.integrity import compute_event_hash, verify_event_hash
from evidence_engine.signatures import (
    generate_key_pair,
    sign_event,
    verify_event_signature,
)
from evidence_engine.ledger import (
    GENESIS_PREV_HASH,
    append_ledger_entry,
    verify_ledger,
    audit_ledger,
    InMemoryLedger,
)


class TestCanonicalization(unittest.TestCase):
    def test_consistent_bytes_different_key_order(self):
        """Test canonicalize_event produces identical bytes for different key ordering."""
        event1 = {
            "timestamp": 1712000000,
            "action": "FILE_ACCESS",
            "actor": "alice",
            "details": {"path": "/etc/passwd", "permission": "read"}
        }
        event2 = {
            "details": {"permission": "read", "path": "/etc/passwd"},
            "actor": "alice",
            "timestamp": 1712000000,
            "action": "FILE_ACCESS"
        }
        bytes1 = canonicalize_event(event1)
        bytes2 = canonicalize_event(event2)
        self.assertEqual(bytes1, bytes2)
        self.assertIsInstance(bytes1, bytes)

    def test_invalid_type_raises_type_error(self):
        """Test non-dict event raises TypeError."""
        with self.assertRaises(TypeError):
            canonicalize_event("not a dict")


class TestIntegrity(unittest.TestCase):
    def test_hash_consistency_and_sensitivity(self):
        """Test same event produces same hash, and modified event produces different hash."""
        event = {"id": "evt-100", "status": "OK", "count": 42}
        hash1 = compute_event_hash(event)
        hash2 = compute_event_hash(event)

        # Same data produces identical SHA-256 digest
        self.assertEqual(hash1, hash2)
        self.assertEqual(len(hash1), 64)

        # Modified data produces a different SHA-256 digest
        modified_event = {"id": "evt-100", "status": "TAMPERED", "count": 42}
        tampered_hash = compute_event_hash(modified_event)
        self.assertNotEqual(hash1, tampered_hash)

    def test_verify_event_hash(self):
        """Test verify_event_hash returns True for match and False for mismatch."""
        event = {"sensor": "camera-1", "event": "motion_detected"}
        valid_hash = compute_event_hash(event)

        # Valid hash matches
        self.assertTrue(verify_event_hash(event, valid_hash))

        # Tampered event data fails verification
        tampered_event = {"sensor": "camera-1", "event": "all_clear"}
        self.assertFalse(verify_event_hash(tampered_event, valid_hash))

        # Mismatched/corrupted hash fails verification
        self.assertFalse(verify_event_hash(event, "deadbeef" * 8))


class TestSignatures(unittest.TestCase):
    def setUp(self):
        # Ephemeral in-memory keys for testing, never saved to disk
        self.private_key, self.public_key = generate_key_pair()
        self.other_priv, self.other_pub = generate_key_pair()

    def test_sign_and_verify_success(self):
        """Test that a valid signature verifies successfully."""
        event = {
            "event_id": "audit-001",
            "action": "SYS_CONFIG_CHANGE",
            "user": "admin"
        }
        sig = sign_event(event, self.private_key)
        self.assertIsInstance(sig, bytes)
        self.assertEqual(len(sig), 64)

        # Verification succeeds with matching public key and untampered event
        self.assertTrue(verify_event_signature(event, sig, self.public_key))

    def test_reject_modified_event_data(self):
        """Test that modifying event data causes signature verification to fail."""
        event = {
            "event_id": "audit-001",
            "action": "SYS_CONFIG_CHANGE",
            "user": "admin"
        }
        sig = sign_event(event, self.private_key)

        tampered_event = {
            "event_id": "audit-001",
            "action": "SYS_CONFIG_CHANGE",
            "user": "intruder"
        }
        self.assertFalse(verify_event_signature(tampered_event, sig, self.public_key))

    def test_reject_wrong_public_key(self):
        """Test that verifying with a different public key fails."""
        event = {"message": "classified message"}
        sig = sign_event(event, self.private_key)

        # Verification fails when checking against a different public key
        self.assertFalse(verify_event_signature(event, sig, self.other_pub))

    def test_corrupted_signature_fails_safely(self):
        """Test that corrupted signature fails safely without raising unhandled exceptions."""
        event = {"message": "classified message"}
        corrupted_sig = b"\x00" * 64
        self.assertFalse(verify_event_signature(event, corrupted_sig, self.public_key))


class TestLedger(unittest.TestCase):
    def test_empty_ledger_is_valid(self):
        """Test that an empty ledger verifies as valid."""
        empty_ledger = []
        self.assertTrue(verify_ledger(empty_ledger))
        is_valid, msg = audit_ledger(empty_ledger)
        self.assertTrue(is_valid)
        self.assertIn("valid", msg.lower())

    def test_valid_chain(self):
        """Test that sequentially appending entries creates a valid hash-linked ledger."""
        ledger = []
        ev1 = compute_event_hash({"action": "LOGIN", "user": "alice"})
        ev2 = compute_event_hash({"action": "READ_FILE", "file": "data.csv"})
        ev3 = compute_event_hash({"action": "LOGOUT", "user": "alice"})

        e1 = append_ledger_entry(ledger, ev1)
        e2 = append_ledger_entry(ledger, ev2)
        e3 = append_ledger_entry(ledger, ev3)

        # Check entry counts and genesis
        self.assertEqual(len(ledger), 3)
        self.assertEqual(e1["entry_id"], 0)
        self.assertEqual(e1["prev_hash"], GENESIS_PREV_HASH)
        self.assertEqual(e2["prev_hash"], e1["entry_hash"])
        self.assertEqual(e3["prev_hash"], e2["entry_hash"])

        # Verification must pass
        self.assertTrue(verify_ledger(ledger))
        is_valid, _ = audit_ledger(ledger)
        self.assertTrue(is_valid)

    def test_tamper_earlier_entry_evidence_hash(self):
        """Test that modifying the evidence_hash in an earlier entry is detected."""
        ledger = []
        ev1 = compute_event_hash({"step": 1})
        ev2 = compute_event_hash({"step": 2})
        ev3 = compute_event_hash({"step": 3})

        append_ledger_entry(ledger, ev1)
        append_ledger_entry(ledger, ev2)
        append_ledger_entry(ledger, ev3)

        self.assertTrue(verify_ledger(ledger))

        # Tamper with entry 0's evidence_hash
        ledger[0]["evidence_hash"] = compute_event_hash({"step": "tampered"})

        # Verification must detect the tampering and fail
        self.assertFalse(verify_ledger(ledger))
        is_valid, msg = audit_ledger(ledger)
        self.assertFalse(is_valid)
        self.assertIn("tampered content", msg.lower())

    def test_tamper_earlier_entry_recomputed_hash_breaks_chain(self):
        """Test that updating an entry's hash to hide content modification breaks the chain link."""
        ledger = []
        ev1 = compute_event_hash({"step": 1})
        ev2 = compute_event_hash({"step": 2})
        append_ledger_entry(ledger, ev1)
        append_ledger_entry(ledger, ev2)

        # Attacker tampers with content and updates entry_hash for entry 0
        ledger[0]["evidence_hash"] = compute_event_hash({"step": "tampered"})
        from evidence_engine.ledger import compute_entry_hash
        ledger[0]["entry_hash"] = compute_entry_hash(0, ledger[0]["evidence_hash"], GENESIS_PREV_HASH)

        # Even though entry 0's hash now matches its content, entry 1's prev_hash link is broken
        self.assertFalse(verify_ledger(ledger))
        is_valid, msg = audit_ledger(ledger)
        self.assertFalse(is_valid)
        self.assertIn("broken chain link", msg.lower())

    def test_tamper_reordering_detected(self):
        """Test that swapping the order of entries is detected."""
        ledger = []
        append_ledger_entry(ledger, compute_event_hash({"item": 1}))
        append_ledger_entry(ledger, compute_event_hash({"item": 2}))

        # Swap entries
        ledger[0], ledger[1] = ledger[1], ledger[0]

        # Verification must detect the reordering
        self.assertFalse(verify_ledger(ledger))

    def test_in_memory_ledger_wrapper(self):
        """Test convenience InMemoryLedger class."""
        mem_ledger = InMemoryLedger()
        self.assertTrue(mem_ledger.verify())

        ev = compute_event_hash({"system": "AEGISX", "status": "ONLINE"})
        mem_ledger.append(ev)
        self.assertEqual(len(mem_ledger), 1)
        self.assertTrue(mem_ledger.verify())


if __name__ == "__main__":
    unittest.main()
