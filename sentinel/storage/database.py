import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from sentinel.config import DATABASE_PATH
from sentinel.crypto.integrity import GENESIS_PREVIOUS_HASH
from sentinel.schemas.action import ActionStatus, SimulatedAction
from sentinel.schemas.event import EventModel, SeverityEnum
from sentinel.schemas.evidence import EvidenceRecord


class Database:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or DATABASE_PATH
        # Ensure parent directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        # Enable WAL mode for better concurrency in SQLite
        conn.execute("PRAGMA journal_mode=WAL;")
        return conn

    def init_db(self) -> None:
        """Create tables and indexes if they do not exist."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Events table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                event_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                source TEXT NOT NULL,
                event_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                host TEXT NOT NULL,
                message TEXT NOT NULL,
                payload TEXT NOT NULL,
                hash TEXT NOT NULL,
                signature TEXT NOT NULL,
                account TEXT,
                principal TEXT,
                endpoint TEXT,
                created_at TEXT NOT NULL
            );
            """)

            # Evidence ledger table (Cryptographically linked)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS evidence_ledger (
                evidence_id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL,
                canonical_hash TEXT NOT NULL,
                signature TEXT NOT NULL,
                previous_hash TEXT NOT NULL,
                chain_hash TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                integrity_status TEXT NOT NULL,
                metadata TEXT NOT NULL,
                FOREIGN KEY (event_id) REFERENCES events (event_id)
            );
            """)

            # Telemetry Sources table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS sources (
                source TEXT PRIMARY KEY,
                host TEXT NOT NULL,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                event_count INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'ACTIVE'
            );
            """)

            # Response Actions table (Requires human approval)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS actions (
                action_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                rule_id TEXT NOT NULL,
                target_host TEXT NOT NULL,
                target_entity TEXT NOT NULL,
                action_type TEXT NOT NULL,
                description TEXT NOT NULL,
                risk_level TEXT NOT NULL,
                status TEXT NOT NULL,
                approver TEXT,
                decision_at TEXT,
                justification TEXT,
                simulated_execution_log TEXT
            );
            """)

            # Indexes for high-performance querying
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_ts ON events(timestamp);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);")

            conn.commit()

    def save_event(self, event: EventModel) -> EventModel:
        """Persist event to database."""
        now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO events (
                    event_id, timestamp, source, event_type, severity, host,
                    message, payload, hash, signature, account, principal, endpoint, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event.event_id,
                    event.timestamp,
                    event.source,
                    event.event_type,
                    event.severity.value if isinstance(event.severity, SeverityEnum) else event.severity,
                    event.host,
                    event.message,
                    json.dumps(event.payload),
                    event.hash or "",
                    event.signature or "",
                    event.account,
                    event.principal,
                    event.endpoint,
                    now_iso,
                ),
            )
            conn.commit()
        return event

    def get_events(
        self,
        severity: Optional[str] = None,
        source: Optional[str] = None,
        event_type: Optional[str] = None,
        host: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[int, List[EventModel]]:
        """Query events with optional filtering and pagination."""
        query = "SELECT * FROM events WHERE 1=1"
        params: List[Any] = []

        if severity:
            query += " AND severity = ?"
            params.append(severity)
        if source:
            query += " AND source = ?"
            params.append(source)
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        if host:
            query += " AND host = ?"
            params.append(host)

        count_query = query.replace("SELECT *", "SELECT COUNT(*)")

        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        fetch_params = list(params) + [limit, offset]

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]

            cursor.execute(query, fetch_params)
            rows = cursor.fetchall()

            events = []
            for r in rows:
                events.append(
                    EventModel(
                        event_id=r["event_id"],
                        timestamp=r["timestamp"],
                        source=r["source"],
                        event_type=r["event_type"],
                        severity=r["severity"],
                        host=r["host"],
                        message=r["message"],
                        payload=json.loads(r["payload"]) if r["payload"] else {},
                        hash=r["hash"],
                        signature=r["signature"],
                        account=r["account"],
                        principal=r["principal"],
                        endpoint=r["endpoint"],
                    )
                )
        return total, events

    def get_event_by_id(self, event_id: str) -> Optional[EventModel]:
        """Fetch single event by its ID."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM events WHERE event_id = ?", (event_id,))
            r = cursor.fetchone()
            if not r:
                return None
            return EventModel(
                event_id=r["event_id"],
                timestamp=r["timestamp"],
                source=r["source"],
                event_type=r["event_type"],
                severity=r["severity"],
                host=r["host"],
                message=r["message"],
                payload=json.loads(r["payload"]) if r["payload"] else {},
                hash=r["hash"],
                signature=r["signature"],
                account=r["account"],
                principal=r["principal"],
                endpoint=r["endpoint"],
            )

    def get_last_evidence_chain_hash(self) -> str:
        """Returns the chain hash of the latest evidence ledger record, or genesis hash if empty."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT chain_hash FROM evidence_ledger ORDER BY rowid DESC LIMIT 1")
            r = cursor.fetchone()
            if r and r[0]:
                return r[0]
            return GENESIS_PREVIOUS_HASH

    def add_evidence_record(self, record: EvidenceRecord) -> EvidenceRecord:
        """Append a new cryptographic evidence block."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO evidence_ledger (
                    evidence_id, event_id, canonical_hash, signature,
                    previous_hash, chain_hash, timestamp, integrity_status, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.evidence_id,
                    record.event_id,
                    record.canonical_hash,
                    record.signature,
                    record.previous_hash,
                    record.chain_hash,
                    record.timestamp,
                    record.integrity_status,
                    json.dumps(record.metadata),
                ),
            )
            conn.commit()
        return record

    def get_evidence_records(self, limit: int = 100, offset: int = 0) -> Tuple[int, List[EvidenceRecord]]:
        """Fetch evidence ledger records in chronological order for chain verification."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM evidence_ledger")
            total = cursor.fetchone()[0]

            cursor.execute("SELECT * FROM evidence_ledger ORDER BY rowid ASC LIMIT ? OFFSET ?", (limit, offset))
            rows = cursor.fetchall()

            records = []
            for r in rows:
                records.append(
                    EvidenceRecord(
                        evidence_id=r["evidence_id"],
                        event_id=r["event_id"],
                        canonical_hash=r["canonical_hash"],
                        signature=r["signature"],
                        previous_hash=r["previous_hash"],
                        chain_hash=r["chain_hash"],
                        timestamp=r["timestamp"],
                        integrity_status=r["integrity_status"],
                        metadata=json.loads(r["metadata"]) if r["metadata"] else {},
                    )
                )
        return total, records

    def update_evidence_integrity(self, evidence_id: str, status: str) -> None:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE evidence_ledger SET integrity_status = ? WHERE evidence_id = ?", (status, evidence_id))
            conn.commit()

    def upsert_source(self, source: str, host: str, timestamp: str) -> None:
        """Registers or updates source telemetry metadata."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT first_seen, event_count FROM sources WHERE source = ?", (source,))
            existing = cursor.fetchone()

            if existing:
                count = existing["event_count"] + 1
                cursor.execute(
                    "UPDATE sources SET host = ?, last_seen = ?, event_count = ?, status = 'ACTIVE' WHERE source = ?",
                    (host, timestamp, count, source),
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO sources (source, host, first_seen, last_seen, event_count, status)
                    VALUES (?, ?, ?, ?, 1, 'ACTIVE')
                    """,
                    (source, host, timestamp, timestamp),
                )
            conn.commit()

    def get_sources(self) -> List[Dict[str, Any]]:
        """Return all registered telemetry sources."""
        now = datetime.now(timezone.utc)
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sources ORDER BY last_seen DESC")
            rows = cursor.fetchall()
            results = []
            for r in rows:
                last_seen_str = r["last_seen"]
                status = "ACTIVE"
                try:
                    last_seen_dt = datetime.fromisoformat(last_seen_str.replace("Z", "+00:00"))
                    diff_seconds = (now - last_seen_dt.astimezone(timezone.utc)).total_seconds()
                    if diff_seconds > 3600:
                        status = "INACTIVE"
                    elif diff_seconds > 300:
                        status = "STALE"
                except Exception:
                    pass

                results.append({
                    "source": r["source"],
                    "host": r["host"],
                    "first_seen": r["first_seen"],
                    "last_seen": r["last_seen"],
                    "event_count": r["event_count"],
                    "status": status,
                })
        return results

    def save_action(self, action: SimulatedAction) -> SimulatedAction:
        """Persist a simulated response action requiring approval."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO actions (
                    action_id, created_at, rule_id, target_host, target_entity,
                    action_type, description, risk_level, status, approver,
                    decision_at, justification, simulated_execution_log
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    action.action_id,
                    action.created_at,
                    action.rule_id,
                    action.target_host,
                    action.target_entity,
                    action.action_type,
                    action.description,
                    action.risk_level,
                    action.status.value if isinstance(action.status, ActionStatus) else action.status,
                    action.approver,
                    action.decision_at,
                    action.justification,
                    action.simulated_execution_log,
                ),
            )
            conn.commit()
        return action

    def update_action(self, action: SimulatedAction) -> SimulatedAction:
        """Update existing action record."""
        return self.save_action(action)

    def get_actions(self, status: Optional[str] = None, limit: int = 100) -> List[SimulatedAction]:
        """Fetch simulated actions."""
        query = "SELECT * FROM actions WHERE 1=1"
        params: List[Any] = []
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            actions = []
            for r in rows:
                actions.append(
                    SimulatedAction(
                        action_id=r["action_id"],
                        created_at=r["created_at"],
                        rule_id=r["rule_id"],
                        target_host=r["target_host"],
                        target_entity=r["target_entity"],
                        action_type=r["action_type"],
                        description=r["description"],
                        risk_level=r["risk_level"],
                        status=ActionStatus(r["status"]),
                        approver=r["approver"],
                        decision_at=r["decision_at"],
                        justification=r["justification"],
                        simulated_execution_log=r["simulated_execution_log"],
                    )
                )
        return actions

    def get_action_by_id(self, action_id: str) -> Optional[SimulatedAction]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM actions WHERE action_id = ?", (action_id,))
            r = cursor.fetchone()
            if not r:
                return None
            return SimulatedAction(
                action_id=r["action_id"],
                created_at=r["created_at"],
                rule_id=r["rule_id"],
                target_host=r["target_host"],
                target_entity=r["target_entity"],
                action_type=r["action_type"],
                description=r["description"],
                risk_level=r["risk_level"],
                status=ActionStatus(r["status"]),
                approver=r["approver"],
                decision_at=r["decision_at"],
                justification=r["justification"],
                simulated_execution_log=r["simulated_execution_log"],
            )

    def get_status_counts(self) -> Dict[str, Any]:
        """Aggregate summary counts for /api/status endpoint."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM events")
            events_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM evidence_ledger")
            evidence_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM sources")
            sources_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM actions WHERE status = 'PENDING_APPROVAL'")
            pending_actions_count = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM actions")
            total_actions_count = cursor.fetchone()[0]

        return {
            "total_events": events_count,
            "total_evidence_blocks": evidence_count,
            "registered_sources": sources_count,
            "pending_approval_actions": pending_actions_count,
            "total_actions": total_actions_count,
        }
