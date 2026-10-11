import os
import uvicorn
from sentinel.api.app import app

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    print(f"Starting AEGISX Sentinel API server on http://{host}:{port}")
    uvicorn.run("sentinel.api.app:app", host=host, port=port, reload=reload)
