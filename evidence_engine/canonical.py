import json


def canonicalize_event(event: dict) -> bytes:
    """Convert an event dictionary into deterministic UTF-8 JSON bytes."""
    if not isinstance(event, dict):
        raise TypeError("event must be a dictionary")

    try:
        canonical_json = json.dumps(
            event,
            sort_keys=True,
            separators=(",", ":"),
            ensure_ascii=False,
            allow_nan=False
        )
        return canonical_json.encode("utf-8")
    except (TypeError, ValueError) as exc:
        raise ValueError(f"Event cannot be serialized: {exc}") from exc
