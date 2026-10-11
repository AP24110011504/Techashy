"""
AEGISX Sentinel - Application Entry Point
-----------------------------------------
This file instantiates the FastAPI application and mounts the multi-agent
orchestrator API router as specified in TEAM_CONTRACT.md.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from aegisx_orchestrator.api_router import router as orchestrator_router

app = FastAPI(
    title="AEGISX Sentinel API",
    description="Multi-agent security incident investigation, cryptographic evidence verification, and containment API",
    version="0.1.0",
)

# Enable CORS for local development and dashboard integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check endpoint
@app.get("/", tags=["System"])
def root():
    return {
        "status": "online",
        "service": "AEGISX Sentinel",
        "endpoints": [
            "/api/investigate",
            "/api/events/{incident_id}",
            "/api/sources/{incident_id}",
            "/api/evidence/{incident_id}",
            "/api/actions/approve",
            "/docs",
        ],
    }

# Register the 5 AEGISX Orchestrator endpoints
app.include_router(orchestrator_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
