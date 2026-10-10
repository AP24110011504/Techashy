
from datetime import datetime, timezone, timedelta
from collections import defaultdict


DEFAULTS = {
    "failed_login_threshold": 5,
    "failed_login_window_seconds": 300,
    "privilege_db_window_seconds": 120,
    "heartbeat_timeout_seconds": 300,
}


def parse_time(value):
    """Parse an ISO-8601 timestamp into a timezone-aware datetime."""
    if not isinstance(value, str):
        return None

    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)

        return parsed.astimezone(timezone.utc)

    except (ValueError, OverflowError):
        return None


def detect_events(events, now=None, config=None):
    """Return deterministic findings from a sequence of security events."""
    config = {**DEFAULTS, **(config or {})}

    now = parse_time(now) if isinstance(now, str) else now
    now = now or datetime.now(timezone.utc)

    if not isinstance(now, datetime):
        raise TypeError("now must be a datetime, ISO-8601 string, or None")

    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    now = now.astimezone(timezone.utc)

    valid = []
    seen = set()

    for event in events or []:
        if not isinstance(event, dict):
            continue

        event_id = event.get("event_id")
        timestamp = parse_time(event.get("timestamp"))

        if not event_id or event_id in seen or timestamp is None:
            continue

        seen.add(event_id)
        valid.append({**event, "_time": timestamp})

    findings = []

    def add(rule_id, severity, explanation, ids):
        findings.append({
            "rule_id": rule_id,
            "severity": severity,
            "explanation": explanation,
            "event_ids": ids,
            "detected_at": now.isoformat(),
        })

    # Rule 1: Failed login burst, grouped by source and account.
    failed = defaultdict(list)

    for event in valid:
        if event.get("event_type") != "login_failed":
            continue

        key = (event.get("source"), event.get("account"))

        if not all(key):
            continue

        failed[key].append(event)

    threshold = max(1, int(config["failed_login_threshold"]))
    window = max(0, float(config["failed_login_window_seconds"]))

    for (source, account), group in failed.items():
        group.sort(key=lambda e: e["_time"])
        left = 0

        for right, event in enumerate(group):
            while (
                left <= right
                and (
                    event["_time"] - group[left]["_time"]
                ).total_seconds() > window
            ):
                left += 1

            burst = group[left:right + 1]

            if len(burst) >= threshold:
                add(
                    "AUTH_FAILED_LOGIN_BURST",
                    "high",
                    f"Burst of {len(burst)} failed logins for account "
                    f"'{account}' from source '{source}' within {window:g}s.",
                    [e["event_id"] for e in burst],
                )
                break

    # Rule 2: Privileged action followed by database activity.
    privileged = [
        e for e in valid
        if e.get("event_type") == "privileged_access"
    ]

    database = [
        e for e in valid
        if e.get("event_type") == "database_activity"
    ]

    privilege_window = max(
        0, float(config["privilege_db_window_seconds"])
    )

    for p in privileged:
        principal = p.get("principal")

        if not principal:
            continue

        matches = [
            d for d in database
            if d.get("principal") == principal
            and timedelta(0) <= d["_time"] - p["_time"]
            <= timedelta(seconds=privilege_window)
        ]

        if matches:
            d = min(matches, key=lambda e: e["_time"])

            add(
                "PRIVILEGE_DB_ACTIVITY",
                "critical",
                f"Privileged access by '{principal}' followed by database "
                f"activity within {privilege_window:g}s.",
                [p["event_id"], d["event_id"]],
            )

    # Rule 3: An explicitly reported heartbeat is stale.
    timeout = max(
        0, float(config["heartbeat_timeout_seconds"])
    )

    for event in valid:
        if event.get("event_type") != "edr_heartbeat":
            continue

        if not event.get("endpoint"):
            continue

        age = (now - event["_time"]).total_seconds()

        # Future-dated heartbeats must not trigger stale-heartbeat alerts.
        if age > timeout:
            add(
                "EDR_HEARTBEAT_LOSS",
                "medium",
                f"EDR heartbeat lost for endpoint "
                f"'{event['endpoint']}': "
                f"last seen {age:g}s ago (timeout {timeout:g}s).",
                [event["event_id"]],
            )

    return findings
