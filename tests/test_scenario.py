import os
import tempfile
import unittest

from sentinel.scenarios.simulator import ScenarioSimulator
from sentinel.schemas.action import ActionStatus
from sentinel.storage.database import Database


class ScenarioTests(unittest.TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self.db_path = os.path.join(self.tmp_dir.name, "scenario_test.db")
        self.db = Database(db_path=self.db_path)
        self.simulator = ScenarioSimulator(self.db)

    def tearDown(self):
        self.tmp_dir.cleanup()

    def test_full_scenario_execution(self):
        result = self.simulator.run_scenario(
            target_host="srv-prod-db01",
            target_account="admin",
            scenario_name="APT_INTRUSION_AND_TAMPER",
        )

        self.assertEqual(result["status"], "COMPLETED")
        self.assertEqual(len(result["stages_executed"]), 5)

        # Check detection findings: teammate rules should trigger
        findings = result["detection_findings"]
        rule_ids = [f["rule_id"] for f in findings]
        self.assertIn("AUTH_FAILED_LOGIN_BURST", rule_ids)
        self.assertIn("PRIVILEGE_DB_ACTIVITY", rule_ids)
        self.assertIn("EDR_HEARTBEAT_LOSS", rule_ids)

        # Check evidence tamper detection: Stage 5 modified a record in DB,
        # so evidence ledger integrity audit must catch it!
        evidence_integrity = result["evidence_ledger_integrity"]
        self.assertTrue(evidence_integrity["tamper_detected"])

        # Check pending approval actions
        pending_actions = self.db.get_actions(status="PENDING_APPROVAL")
        self.assertTrue(len(pending_actions) >= 4)
        for act in pending_actions:
            self.assertEqual(act.status, ActionStatus.PENDING_APPROVAL)
            self.assertIsNone(act.decision_at)


if __name__ == "__main__":
    unittest.main()
