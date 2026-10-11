import os
import tempfile
import unittest
from fastapi.testclient import TestClient

from sentinel.api.app import create_app
from sentinel.schemas.action import ActionStatus


class IntegrationTests(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.db_path = os.path.join(self.tmp_dir.name, "integration_test.db")
        self.app = create_app(db_path=self.db_path)
        self.client = TestClient(self.app)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_end_to_end_system_workflow(self):
        # Step 1: Initial status check
        status_res = self.client.get("/api/status")
        self.assertEqual(status_res.status_code, 200)
        self.assertEqual(status_res.json()["metrics"]["total_events"], 0)

        # Step 2: Telemetry ingestion from simulated sources
        events_payload = [
            {
                "source": "auth-gateway",
                "event_type": "login_success",
                "severity": "info",
                "host": "srv-app01",
                "message": "Operator authenticated",
            },
            {
                "source": "edr-agent",
                "event_type": "edr_heartbeat",
                "severity": "info",
                "host": "srv-app01",
                "message": "Heartbeat OK",
                "endpoint": "srv-app01",
            },
        ]
        for evt in events_payload:
            ingest_res = self.client.post("/api/events", json=evt)
            self.assertEqual(ingest_res.status_code, 200)

        # Step 3: Verify sources registry
        sources_res = self.client.get("/api/sources")
        self.assertEqual(sources_res.status_code, 200)
        self.assertEqual(sources_res.json()["total_sources"], 2)

        # Step 4: Verify evidence ledger intact
        evidence_res = self.client.get("/api/evidence")
        self.assertEqual(evidence_res.status_code, 200)
        self.assertTrue(evidence_res.json()["ledger_valid"])
        self.assertEqual(evidence_res.json()["total_records"], 2)

        # Step 5: Run incident scenario simulation
        scenario_res = self.client.post("/api/scenario/run", json={"target_host": "srv-prod-db01"})
        self.assertEqual(scenario_res.status_code, 200)
        scenario_data = scenario_res.json()
        self.assertEqual(scenario_data["status"], "COMPLETED")
        self.assertTrue(len(scenario_data["pending_approval_actions"]) > 0)

        # Step 6: Multi-agent AI investigation
        inv_res = self.client.post("/api/investigate", json={
            "query": "Investigate anomalous database queries on srv-prod-db01",
            "focus": "all",
        })
        self.assertEqual(inv_res.status_code, 200)
        inv_data = inv_res.json()
        self.assertIn("TriageAgent", [f["agent"] for f in inv_data["findings"]])
        self.assertIn("EvidenceAgent", [f["agent"] for f in inv_data["findings"]])
        self.assertIn("ThreatHunterAgent", [f["agent"] for f in inv_data["findings"]])
        self.assertTrue(len(inv_data["mitre_tactics"]) > 0)

        # Step 7: Voice query processing
        voice_res = self.client.post("/api/voice/query", json={
            "query_text": "Are there any actions awaiting approval?",
        })
        self.assertEqual(voice_res.status_code, 200)
        voice_data = voice_res.json()
        self.assertEqual(voice_data["intent"], "pending_approvals")
        self.assertIn("pending response actions requiring operator authorization", voice_data["speech_text"])

        # Step 8: Human approval for response action
        actions_res = self.client.get("/api/actions?status=PENDING_APPROVAL")
        self.assertEqual(actions_res.status_code, 200)
        actions = actions_res.json()["actions"]
        self.assertTrue(len(actions) > 0)

        action_to_approve = actions[0]["action_id"]
        approve_res = self.client.post("/api/actions/approve", json={
            "action_id": action_to_approve,
            "decision": "approve",
            "approver": "team_lead@aegisx.local",
            "justification": "Approved isolation after multi-agent investigation verdict",
        })
        self.assertEqual(approve_res.status_code, 200)
        approve_data = approve_res.json()
        self.assertEqual(approve_data["action"]["status"], ActionStatus.EXECUTED_SIMULATED.value)
        self.assertEqual(approve_data["action"]["approver"], "team_lead@aegisx.local")

        # Step 9: Verify updated system status
        final_status_res = self.client.get("/api/status")
        self.assertEqual(final_status_res.status_code, 200)
        final_metrics = final_status_res.json()["metrics"]
        self.assertTrue(final_metrics["total_events"] > 5)
        self.assertTrue(final_metrics["total_evidence_blocks"] > 5)


if __name__ == "__main__":
    unittest.main()
