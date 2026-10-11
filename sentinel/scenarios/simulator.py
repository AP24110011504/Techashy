import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from detection.detector import detect_events
from sentinel.crypto.integrity import (
    compute_canonical_event_hash,
    compute_chain_hash,
    compute_event_signature,
    verify_chain_integrity,
)
from sentinel.schemas.action import ActionStatus, SimulatedAction
from sentinel.schemas.event import EventCreate, EventModel, SeverityEnum
from sentinel.schemas.evidence import EvidenceRecord
from sentinel.storage.database import Database


class ScenarioSimulator:
    """
    Safely generates a multi-stage simulated incident for live demonstrations and testing:
      1. Suspicious Login (burst of 5 failed attempts)
      2. Network Activity (suspicious outbound egress connection)
      3. Database Access (privileged escalation followed by sensitive table query)
      4. Sensor Heartbeat Loss (stale EDR heartbeat timeout)
      5. Simulated Log Tampering (cryptographic hash/signature mismatch)
    Requires human approval for all simulated response actions.
    """

    def __init__(self, db: Database):
        self.db = db

    def run_scenario(
        self,
        target_host: str = "srv-prod-db01",
        target_account: str = "admin",
        scenario_name: str = "APT_INTRUSION_AND_TAMPER",
    ) -> Dict[str, Any]:
        base_time = datetime.now(timezone.utc)
        events_to_ingest: List[EventModel] = []
        evidence_records: List[EvidenceRecord] = []
        pending_actions: List[SimulatedAction] = []

        # --- Stage 1: Suspicious Login (Burst of 5 failed logins) ---
        for i in range(5):
            evt_time = (base_time - timedelta(seconds=240 - i * 10)).isoformat().replace("+00:00", "Z")
            evt_create = EventCreate(
                event_id=f"sim-login-{uuid.uuid4().hex[:6]}",
                timestamp=evt_time,
                source="auth-gateway-01",
                event_type="login_failed",
                severity=SeverityEnum.high,
                host=target_host,
                message=f"Failed SSH login attempt {i+1}/5 for account '{target_account}' from 198.51.100.42",
                payload={"attempt": i + 1, "ip": "198.51.100.42", "port": 22, "protocol": "ssh"},
                account=target_account,
            )
            events_to_ingest.append(self._seal_and_save_event(evt_create))

        # --- Stage 2: Suspicious Network Activity ---
        net_time = (base_time - timedelta(seconds=180)).isoformat().replace("+00:00", "Z")
        net_create = EventCreate(
            event_id=f"sim-net-{uuid.uuid4().hex[:6]}",
            timestamp=net_time,
            source="firewall-core-edge",
            event_type="network_egress_anomaly",
            severity=SeverityEnum.medium,
            host=target_host,
            message=f"Unusual high-volume outbound network flow from {target_host} to external 203.0.113.88:4444",
            payload={"dest_ip": "203.0.113.88", "dest_port": 4444, "bytes_sent": 842000, "flag": "SYN_SENT"},
        )
        events_to_ingest.append(self._seal_and_save_event(net_create))

        # --- Stage 3: Database Access After Privilege Escalation ---
        priv_time = (base_time - timedelta(seconds=120)).isoformat().replace("+00:00", "Z")
        priv_create = EventCreate(
            event_id=f"sim-priv-{uuid.uuid4().hex[:6]}",
            timestamp=priv_time,
            source="identity-pam",
            event_type="privileged_access",
            severity=SeverityEnum.high,
            host=target_host,
            message="Privilege escalation granted to svc_dbadmin with sudo/SUPERUSER role",
            payload={"elevation_type": "sudo", "granted_role": "SUPERUSER"},
            principal="svc_dbadmin",
        )
        events_to_ingest.append(self._seal_and_save_event(priv_create))

        db_time = (base_time - timedelta(seconds=100)).isoformat().replace("+00:00", "Z")
        db_create = EventCreate(
            event_id=f"sim-db-{uuid.uuid4().hex[:6]}",
            timestamp=db_time,
            source="db-audit-agent",
            event_type="database_activity",
            severity=SeverityEnum.critical,
            host=target_host,
            message="Sensitive table dump: 'SELECT * FROM customers_pii' exported",
            payload={"query": "SELECT * FROM customers_pii", "rows_returned": 25400, "table": "customers_pii"},
            principal="svc_dbadmin",
        )
        events_to_ingest.append(self._seal_and_save_event(db_create))

        # --- Stage 4: Sensor Heartbeat Loss ---
        # Stale heartbeat dated 12 minutes in past
        stale_time = (base_time - timedelta(minutes=12)).isoformat().replace("+00:00", "Z")
        hb_create = EventCreate(
            event_id=f"sim-hb-{uuid.uuid4().hex[:6]}",
            timestamp=stale_time,
            source="edr-agent-host",
            event_type="edr_heartbeat",
            severity=SeverityEnum.medium,
            host=target_host,
            message=f"Last recorded EDR heartbeat for host {target_host}",
            payload={"agent_version": "2.4.1", "status": "nominal"},
            endpoint=target_host,
        )
        events_to_ingest.append(self._seal_and_save_event(hb_create))

        # --- Stage 5: Simulated Log Tampering ---
        tamper_time = (base_time - timedelta(seconds=30)).isoformat().replace("+00:00", "Z")
        tamper_evt_create = EventCreate(
            event_id=f"sim-tamper-{uuid.uuid4().hex[:6]}",
            timestamp=tamper_time,
            source="syslog-collector",
            event_type="security_audit",
            severity=SeverityEnum.high,
            host=target_host,
            message="Original unadulterated audit log entry before malicious modification",
            payload={"authorized": False, "tamper_demo": True},
        )
        sealed_tamper_evt = self._seal_and_save_event(tamper_evt_create)
        events_to_ingest.append(sealed_tamper_evt)

        # Deliberately modify the saved event's message in the database WITHOUT updating hash or signature,
        # simulating a malicious adversary or rogue insider tampering with the database record.
        with self.db.get_connection() as conn:
            conn.execute(
                "UPDATE events SET message = ? WHERE event_id = ?",
                ("TAMPERED_LOG: Normal routine maintenance - Nothing to see here.", sealed_tamper_evt.event_id),
            )
            conn.commit()

        # Run teammate's detector against all ingested events
        detector_payloads = [e.to_detector_dict() for e in events_to_ingest]
        findings = detect_events(detector_payloads, now=base_time.isoformat())

        # Audit evidence ledger to verify that the tamper is immediately caught
        _, all_evidence = self.db.get_evidence_records(limit=200)
        rec_dicts = [r.model_dump() for r in all_evidence]
        _, all_events = self.db.get_events(limit=500)
        events_map = {e.event_id: e.model_dump() for e in all_events}
        is_chain_valid, chain_violations = verify_chain_integrity(rec_dicts, events_by_id=events_map)

        # Propose simulated response actions (Requires Human Approval)
        proposed_actions = [
            SimulatedAction(
                rule_id="AUTH_FAILED_LOGIN_BURST",
                target_host=target_host,
                target_entity="198.51.100.42",
                action_type="BLOCK_IP",
                description=f"Simulated boundary firewall block for brute-force source IP 198.51.100.42 targeting host {target_host}.",
                risk_level="low",
                status=ActionStatus.PENDING_APPROVAL,
            ),
            SimulatedAction(
                rule_id="PRIVILEGE_DB_ACTIVITY",
                target_host=target_host,
                target_entity=target_host,
                action_type="ISOLATE_HOST",
                description=f"Simulated network quarantine of host {target_host} following unauthorized sensitive database exfiltration.",
                risk_level="high",
                status=ActionStatus.PENDING_APPROVAL,
            ),
            SimulatedAction(
                rule_id="PRIVILEGE_DB_ACTIVITY",
                target_host="identity-provider",
                target_entity="svc_dbadmin",
                action_type="REVOKE_CREDENTIALS",
                description="Simulated emergency revocation of credentials and active sessions for service principal 'svc_dbadmin'.",
                risk_level="medium",
                status=ActionStatus.PENDING_APPROVAL,
            ),
            SimulatedAction(
                rule_id="EDR_HEARTBEAT_LOSS",
                target_host=target_host,
                target_entity=f"edr-{target_host}",
                action_type="RESTART_EDR_SENSOR",
                description=f"Simulated remote sensor diagnostic probe and restart for stale EDR agent on {target_host}.",
                risk_level="low",
                status=ActionStatus.PENDING_APPROVAL,
            ),
        ]

        for act in proposed_actions:
            self.db.save_action(act)
            pending_actions.append(act)

        return {
            "scenario": scenario_name,
            "status": "COMPLETED",
            "target_host": target_host,
            "stages_executed": [
                "1. Suspicious Login (Burst of 5 failed attempts from 198.51.100.42)",
                "2. Network Activity (Outbound anomaly to 203.0.113.88:4444)",
                "3. Database Access (Privilege escalation + customer PII query)",
                "4. Sensor Heartbeat Loss (EDR heartbeat lost > 10 min ago)",
                "5. Simulated Log Tampering (Payload modified to test evidence integrity)",
            ],
            "events_generated_count": len(events_to_ingest),
            "detection_findings": findings,
            "evidence_ledger_integrity": {
                "ledger_valid": is_chain_valid,
                "violations_caught": len(chain_violations),
                "tamper_detected": not is_chain_valid or any("sim-tamper" in str(v) for v in chain_violations),
            },
            "pending_approval_actions": [a.model_dump() for a in pending_actions],
            "human_approval_enforced": True,
        }

    def _seal_and_save_event(self, evt: EventCreate) -> EventModel:
        """Computes hash, signature, chain link, and persists event + evidence block."""
        event_dict = evt.model_dump()
        c_hash = compute_canonical_event_hash(event_dict)
        sig = compute_event_signature(c_hash)

        event_model = EventModel(**{**event_dict, "hash": c_hash, "signature": sig})
        self.db.save_event(event_model)
        self.db.upsert_source(event_model.source, event_model.host, event_model.timestamp)

        # Chained evidence block
        prev_hash = self.db.get_last_evidence_chain_hash()
        chain_hash = compute_chain_hash(prev_hash, c_hash, event_model.timestamp)
        evidence_rec = EvidenceRecord(
            evidence_id=f"evid-{uuid.uuid4().hex[:8]}",
            event_id=event_model.event_id,
            canonical_hash=c_hash,
            signature=sig,
            previous_hash=prev_hash,
            chain_hash=chain_hash,
            timestamp=event_model.timestamp,
            integrity_status="VERIFIED",
            metadata={"source": event_model.source, "host": event_model.host},
        )
        self.db.add_evidence_record(evidence_rec)
        return event_model
