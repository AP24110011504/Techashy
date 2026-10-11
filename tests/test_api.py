import os
import tempfile
import unittest
from fastapi.testclient import TestClient

from sentinel.api.app import create_app
from sentinel.schemas.action import ActionStatus, SimulatedAction


class ApiEndpointTests(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.db_path = os.path.join(self.tmp_dir.name, "test_sentinel.db")
        self.app = create_app(db_path=self.db_path)
        self.client = TestClient(self.app)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_status_endpoint(self):
        res = self.client.get("/api/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "ONLINE")
        self.assertIn("components", data)
        self.assertEqual(data["components"]["detection_engine"], "ACTIVE")

    def test_ingest_and_list_events(self):
        # Ingest single event
        payload = {
            "source": "auth-service",
            "event_type": "login_success",
            "severity": "info",
            "host": "srv-app01",
            "message": "User alice logged in successfully",
            "payload": {"auth_method": "mfa"},
        }
        res_post = self.client.post("/api/events", json=payload)
        self.assertEqual(res_post.status_code, 200)
        data_post = res_post.json()
        self.assertEqual(data_post["status"], "success")
        self.assertEqual(data_post["ingested_count"], 1)
        self.assertTrue(data_post["events"][0]["hash"])
        self.assertTrue(data_post["events"][0]["signature"])

        # Query events list
        res_get = self.client.get("/api/events?source=auth-service")
        self.assertEqual(res_get.status_code, 200)
        data_get = res_get.json()
        self.assertEqual(data_get["total"], 1)
        self.assertEqual(data_get["events"][0]["host"], "srv-app01")

    def test_sources_endpoint(self):
        # Post event
        self.client.post("/api/events", json={
            "source": "edr-agent-01",
            "event_type": "edr_heartbeat",
            "severity": "info",
            "host": "srv-db01",
            "message": "Heartbeat nominal",
        })
        res = self.client.get("/api/sources")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_sources"], 1)
        self.assertEqual(data["sources"][0]["source"], "edr-agent-01")

    def test_evidence_endpoint(self):
        self.client.post("/api/events", json={
            "source": "network-firewall",
            "event_type": "port_scan_detected",
            "severity": "high",
            "host": "perimeter-fw",
            "message": "SYN scan detected",
        })
        res = self.client.get("/api/evidence")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["total_records"], 1)
        self.assertTrue(data["ledger_valid"])
        self.assertEqual(data["tampered_count"], 0)

    def test_scenario_run_endpoint(self):
        res = self.client.post("/api/scenario/run", json={"target_host": "srv-prod-db01"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "COMPLETED")
        self.assertEqual(data["target_host"], "srv-prod-db01")
        self.assertTrue(len(data["stages_executed"]) == 5)
        self.assertTrue(data["events_generated_count"] >= 8)
        self.assertTrue(len(data["pending_approval_actions"]) > 0)
        self.assertTrue(data["human_approval_enforced"])

    def test_investigate_endpoint(self):
        # Ingest some telemetry first
        self.client.post("/api/events", json={
            "source": "auth-service",
            "event_type": "login_failed",
            "severity": "high",
            "host": "srv-01",
            "message": "Root login attempt failed",
            "account": "root",
        })
        res = self.client.post("/api/investigate", json={"query": "Investigate root login attempts"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("investigation_id", data)
        self.assertIn("confidence_score", data)
        self.assertIn("summary", data)
        self.assertTrue(len(data["findings"]) == 3)  # Triage, Evidence, Threat Hunter

    def test_voice_query_endpoint(self):
        res = self.client.post("/api/voice/query", json={"query_text": "What is the system status?"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["intent"], "status_summary")
        self.assertIn("AEGISX Sentinel is online", data["speech_text"])

    def test_actions_approval_workflow(self):
        # Seed an action directly via DB
        db = self.app.state.db
        action = SimulatedAction(
            action_id="act-test-01",
            rule_id="TEST_RULE",
            target_host="host-test",
            target_entity="host-test",
            action_type="ISOLATE_HOST",
            description="Test isolation action",
            risk_level="high",
            status=ActionStatus.PENDING_APPROVAL,
        )
        db.save_action(action)

        # Approve action
        res_approve = self.client.post("/api/actions/approve", json={
            "action_id": "act-test-01",
            "decision": "approve",
            "approver": "sec_lead@aegisx.local",
            "justification": "Approved for containment test",
        })
        self.assertEqual(res_approve.status_code, 200)
        data_approve = res_approve.json()
        self.assertEqual(data_approve["status"], "success")
        self.assertEqual(data_approve["action"]["status"], "EXECUTED_SIMULATED")
        self.assertIn("SIMULATED SAFE EXECUTION", data_approve["action"]["simulated_execution_log"])

        # Attempting to decide on an already decided action should fail (400)
        res_redecide = self.client.post("/api/actions/approve", json={
            "action_id": "act-test-01",
            "decision": "reject",
            "approver": "sec_lead@aegisx.local",
        })
        self.assertEqual(res_redecide.status_code, 400)


if __name__ == "__main__":
    unittest.main()
