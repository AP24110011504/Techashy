import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sentinel.crypto.integrity import verify_chain_integrity
from sentinel.schemas.action import ActionStatus, SimulatedAction
from sentinel.schemas.event import EventModel
from sentinel.schemas.investigation import (
    InvestigationFinding,
    InvestigationRequest,
    InvestigationResponse,
)
from sentinel.schemas.voice import VoiceQueryRequest, VoiceQueryResponse
from sentinel.storage.database import Database


class TriageAgent:
    """Evaluates event telemetry severity and maps anomalies to the MITRE ATT&CK matrix."""

    MITRE_MAPPING = {
        "AUTH_FAILED_LOGIN_BURST": ["T1110.001 (Brute Force: Password Guessing)", "TA0006 (Credential Access)"],
        "PRIVILEGE_DB_ACTIVITY": ["T1078 (Valid Accounts)", "T1059 (Command Execution)", "TA0004 (Privilege Escalation)", "TA0010 (Exfiltration)"],
        "EDR_HEARTBEAT_LOSS": ["T1562.001 (Impair Defenses: Disable or Modify Tools)", "TA0005 (Defense Evasion)"],
        "TAMPER_DETECTED": ["T1565.001 (Data Manipulation: Stored Data Manipulation)", "TA0040 (Impact)"],
        "NETWORK_ANOMALY": ["T1048 (Exfiltration Over Alternative Protocol)", "TA0011 (Command and Control)"],
    }

    def analyze(self, findings: List[Dict[str, Any]], events: List[EventModel]) -> Dict[str, Any]:
        tactics = []
        highest_severity = "low"
        severity_rank = {"info": 0, "low": 1, "medium": 2, "high": 3, "critical": 4}

        for f in findings:
            rule_id = f.get("rule_id", "")
            mapped = self.MITRE_MAPPING.get(rule_id, ["T1059 (Execution)"])
            tactics.extend(mapped)

            f_sev = f.get("severity", "low").lower()
            if severity_rank.get(f_sev, 0) > severity_rank.get(highest_severity, 0):
                highest_severity = f_sev

        for e in events:
            e_sev = e.severity.value if hasattr(e.severity, "value") else str(e.severity).lower()
            if severity_rank.get(e_sev, 0) > severity_rank.get(highest_severity, 0):
                highest_severity = e_sev

        return {
            "verdict": f"Triage complete. Assessed overall threat severity as '{highest_severity.upper()}'.",
            "confidence": 0.94 if findings else 0.70,
            "severity": highest_severity,
            "mitre_tactics": list(dict.fromkeys(tactics)),
            "findings_count": len(findings),
        }


class EvidenceAgent:
    """Audits cryptographic integrity of the evidence ledger and verifies chain validity."""

    def __init__(self, db: Database):
        self.db = db

    def audit(self) -> Dict[str, Any]:
        _, records = self.db.get_evidence_records(limit=500)
        rec_dicts = [r.model_dump() for r in records]
        _, events = self.db.get_events(limit=500)
        events_map = {e.event_id: e.model_dump() for e in events}
        is_valid, violations = verify_chain_integrity(rec_dicts, events_by_id=events_map)

        tampered_ids = [v.get("evidence_id") for v in violations]
        for vid in tampered_ids:
            if vid:
                self.db.update_evidence_integrity(vid, "TAMPERED")

        verdict = "VERIFIED" if is_valid else "TAMPER_DETECTED"
        confidence = 0.99 if is_valid else 0.98

        return {
            "verdict": verdict,
            "confidence": confidence,
            "total_blocks_audited": len(records),
            "is_valid": is_valid,
            "violations": violations,
            "summary": (
                "Cryptographic evidence chain verified intact with valid SHA-256 signatures."
                if is_valid
                else f"Integrity violations detected! {len(violations)} evidence block(s) altered or unlinked."
            ),
        }


class ThreatHunterAgent:
    """Synthesizes kill chain progression and determines blast radius."""

    def hunt(self, events: List[EventModel], findings: List[Dict[str, Any]]) -> Dict[str, Any]:
        hosts = set()
        principals = set()
        sources = set()

        timeline = []
        for e in sorted(events, key=lambda x: x.timestamp):
            hosts.add(e.host)
            sources.add(e.source)
            if e.principal:
                principals.add(e.principal)
            if e.account:
                principals.add(e.account)

            timeline.append({
                "timestamp": e.timestamp,
                "event_id": e.event_id,
                "host": e.host,
                "event_type": e.event_type,
                "severity": e.severity.value if hasattr(e.severity, "value") else str(e.severity),
                "message": e.message,
            })

        blast_radius = {
            "impacted_hosts": sorted(list(hosts)),
            "impacted_accounts": sorted(list(principals)),
            "reporting_sources": sorted(list(sources)),
        }

        # Formulate root cause analysis hypothesis
        if any("BURST" in f.get("rule_id", "") for f in findings) and any("DB" in f.get("rule_id", "") for f in findings):
            root_cause = "Credential stuffing / brute-force authentication succeeded by privileged database extraction."
        elif any("HEARTBEAT" in f.get("rule_id", "") for f in findings):
            root_cause = "Host communication loss possibly indicating sensor tampering or network isolation."
        else:
            root_cause = "Anomalous telemetry sequence observed requiring ongoing correlation."

        return {
            "verdict": f"Threat hunting analysis formulated root cause: {root_cause}",
            "confidence": 0.88,
            "blast_radius": blast_radius,
            "timeline": timeline,
            "root_cause": root_cause,
        }


class AgentOrchestrator:
    """Coordinates Triage, Evidence, and Threat Hunting agents, plus SOC Voice NLP queries."""

    def __init__(self, db: Database):
        self.db = db
        self.triage_agent = TriageAgent()
        self.evidence_agent = EvidenceAgent(db)
        self.threat_hunter = ThreatHunterAgent()

    def investigate(self, req: InvestigationRequest, findings: Optional[List[Dict[str, Any]]] = None) -> InvestigationResponse:
        # Gather relevant events
        if req.event_ids:
            events = [e for eid in req.event_ids if (e := self.db.get_event_by_id(eid))]
        else:
            _, events = self.db.get_events(limit=50)

        # Run detection if findings not explicitly provided
        from detection.detector import detect_events
        computed_findings = findings or detect_events([e.to_detector_dict() for e in events])

        # Multi-agent analysis
        triage_res = self.triage_agent.analyze(computed_findings, events)
        evidence_res = self.evidence_agent.audit()
        hunting_res = self.threat_hunter.hunt(events, computed_findings)

        agent_findings = [
            InvestigationFinding(
                agent="TriageAgent",
                verdict=triage_res["verdict"],
                confidence=triage_res["confidence"],
                details=triage_res,
            ),
            InvestigationFinding(
                agent="EvidenceAgent",
                verdict=evidence_res["verdict"],
                confidence=evidence_res["confidence"],
                details=evidence_res,
            ),
            InvestigationFinding(
                agent="ThreatHunterAgent",
                verdict=hunting_res["verdict"],
                confidence=hunting_res["confidence"],
                details=hunting_res,
            ),
        ]

        # Calculate composite confidence
        composite_confidence = round(
            (triage_res["confidence"] + evidence_res["confidence"] + hunting_res["confidence"]) / 3.0, 2
        )

        # Determine recommended actions (marked PENDING_APPROVAL)
        recommended_actions = []
        for host in hunting_res["blast_radius"]["impacted_hosts"]:
            if triage_res["severity"] in ["high", "critical"]:
                act = SimulatedAction(
                    rule_id="INCIDENT_CONTAINMENT",
                    target_host=host,
                    target_entity=host,
                    action_type="ISOLATE_HOST",
                    description=f"Simulated network isolation for compromised host '{host}'",
                    risk_level="high",
                    status=ActionStatus.PENDING_APPROVAL,
                )
                self.db.save_action(act)
                recommended_actions.append(act)

        for account in hunting_res["blast_radius"]["impacted_accounts"]:
            act = SimulatedAction(
                rule_id="IDENTITY_CONTAINMENT",
                target_host="identity-provider",
                target_entity=account,
                action_type="REVOKE_CREDENTIALS",
                description=f"Simulated revocation of sessions and API keys for account '{account}'",
                risk_level="medium",
                status=ActionStatus.PENDING_APPROVAL,
            )
            self.db.save_action(act)
            recommended_actions.append(act)

        summary_parts = [
            f"Investigation conducted across {len(events)} events and {len(computed_findings)} detection findings.",
            f"Assessed threat severity: {triage_res['severity'].upper()}.",
            f"Evidence ledger integrity: {evidence_res['verdict']}.",
            f"Root cause hypothesis: {hunting_res['root_cause']}.",
            f"Identified {len(recommended_actions)} response action(s) requiring human approval.",
        ]

        return InvestigationResponse(
            query=req.query,
            summary=" ".join(summary_parts),
            confidence_score=composite_confidence,
            correlated_timeline=hunting_res["timeline"],
            mitre_tactics=triage_res["mitre_tactics"],
            evidence_verdict=evidence_res["verdict"],
            findings=agent_findings,
            recommended_actions=recommended_actions,
        )

    def process_voice_query(self, req: VoiceQueryRequest) -> VoiceQueryResponse:
        """Parses speech or text queries and generates natural language audio synthesis and card payload."""
        text = req.query_text.lower().strip()

        # Intent classification
        if any(w in text for w in ["status", "overview", "health", "system"]):
            intent = "status_summary"
            counts = self.db.get_status_counts()
            speech = (
                f"AEGISX Sentinel is online and operational. The system has ingested {counts['total_events']} events, "
                f"sealed {counts['total_evidence_blocks']} evidence blocks across {counts['registered_sources']} sources. "
                f"There are currently {counts['pending_approval_actions']} response actions awaiting your approval."
            )
            data = counts

        elif any(w in text for w in ["tamper", "tampered", "integrity", "verify", "ledger"]):
            intent = "tamper_audit"
            evidence_audit = self.evidence_agent.audit()
            if evidence_audit["is_valid"]:
                speech = (
                    f"Evidence ledger audit complete. All {evidence_audit['total_blocks_audited']} records "
                    f"are cryptographically verified with zero tamper anomalies detected."
                )
            else:
                speech = (
                    f"Warning! Evidence ledger audit detected {len(evidence_audit['violations'])} tamper violations. "
                    f"Log modification or block decoupling was caught by cryptographic verification."
                )
            data = evidence_audit

        elif any(w in text for w in ["action", "actions", "approval", "approve", "pending"]):
            intent = "pending_approvals"
            pending = self.db.get_actions(status="PENDING_APPROVAL")
            if pending:
                action_types = ", ".join(set(a.action_type for a in pending))
                speech = (
                    f"There are {len(pending)} pending response actions requiring operator authorization, "
                    f"including {action_types}. No automated actions will execute without your approval."
                )
            else:
                speech = "All pending response actions have been handled. Zero actions require approval at this time."
            data = {"pending_count": len(pending), "actions": [a.model_dump() for a in pending]}

        elif any(w in text for w in ["critical", "incident", "threat", "investigate", "alert"]):
            intent = "critical_incidents"
            _, crit_events = self.db.get_events(severity="critical", limit=5)
            _, high_events = self.db.get_events(severity="high", limit=5)
            combined = crit_events + high_events
            if combined:
                speech = (
                    f"Found {len(combined)} high or critical severity security events in recent telemetry. "
                    f"Top alert involves host {combined[0].host} with message: {combined[0].message}."
                )
            else:
                speech = "No critical or high severity security alerts found in recent telemetry."
            data = {"total_high_critical": len(combined), "events": [e.model_dump() for e in combined]}

        else:
            intent = "general_query"
            counts = self.db.get_status_counts()
            speech = (
                f"AEGISX Sentinel assistant acknowledged query: '{req.query_text}'. "
                f"Currently monitoring {counts['registered_sources']} telemetry streams with {counts['total_events']} events."
            )
            data = counts

        return VoiceQueryResponse(
            query_text=req.query_text,
            speech_text=speech,
            intent=intent,
            entities={"query_length": len(req.query_text)},
            data_payload=data,
        )
