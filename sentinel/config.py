import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database Configuration
DATABASE_PATH = os.getenv("AEGISX_DB_PATH", str(DATA_DIR / "sentinel.db"))

# Cryptographic Salt / Secret for Event Signatures (Never hardcode production secrets)
# Used for local simulated HMAC signing and verification
SECRET_KEY = os.getenv("AEGISX_SECRET_KEY", "aegisx-sentinel-dev-secret-key-2026")

# Detection and Heartbeat Thresholds
HEARTBEAT_TIMEOUT_SECONDS = int(os.getenv("AEGISX_HEARTBEAT_TIMEOUT", "300"))
FAILED_LOGIN_THRESHOLD = int(os.getenv("AEGISX_LOGIN_THRESHOLD", "5"))
FAILED_LOGIN_WINDOW_SECONDS = int(os.getenv("AEGISX_LOGIN_WINDOW", "300"))
PRIVILEGE_DB_WINDOW_SECONDS = int(os.getenv("AEGISX_PRIVILEGE_DB_WINDOW", "120"))

# Service Metadata
SERVICE_NAME = "AEGISX Sentinel API"
SERVICE_VERSION = "1.0.0-techashy"
ENVIRONMENT = os.getenv("AEGISX_ENV", "development")
