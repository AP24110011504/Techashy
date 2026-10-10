import unittest
from datetime import datetime, timezone
from detection import detect_events
NOW = "2026-10-10T12:15:00Z"
class DetectorTests(unittest.TestCase):
    def test_empty_input(self):
        self.assertEqual(detect_events([], now=NOW), [])
    def test_failed_login_burst(self):
        events = [
            {
                "event_id": f"login-{i}",
                "timestamp": f"2026-10-10T12:10:{i * 10:02d}Z",
                "event_type": "login_failed",
                "source": "host-a",
                "account": "user-a",
            }
            for i in range(5)
        ]
        findings = detect_events(events, now=NOW)
        self.assertTrue(any(
            f["rule_id"] == "AUTH_FAILED_LOGIN_BURST"
            for f in findings
        ))
    def test_privilege_followed_by_database_activity(self):
        events = [
            {
                "event_id": "priv-1",
                "timestamp": "2026-10-10T12:10:00Z",
                "event_type": "privileged_access",
                "principal": "user-a",
            },
            {
                "event_id": "db-1",
                "timestamp": "2026-10-10T12:11:00Z",
                "event_type": "database_activity",
                "principal": "user-a",
            },
        ]
        findings = detect_events(events, now=NOW)
        self.assertTrue(any(
            f["rule_id"] == "PRIVILEGE_DB_ACTIVITY"
            for f in findings
        ))
    def test_stale_heartbeat(self):
        events = [{
            "event_id": "heartbeat-1",
            "timestamp": "2026-10-10T11:00:00Z",
            "event_type": "edr_heartbeat",
            "endpoint": "host-a",
        }]
        findings = detect_events(events, now=NOW)
        self.assertTrue(any(
            f["rule_id"] == "EDR_HEARTBEAT_LOSS"
            for f in findings
        ))
    def test_malformed_timestamp_is_ignored(self):
        events = [{
            "event_id": "bad-1",
            "timestamp": "not-a-timestamp",
            "event_type": "login_failed",
            "source": "host-a",
            "account": "user-a",
        }]
        self.assertEqual(detect_events(events, now=NOW), [])
if __name__ == "__main__":
    unittest.main()
