from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sentinel.agents.orchestrator import AgentOrchestrator
from sentinel.api.routes import router as api_router
from sentinel.config import ENVIRONMENT, SERVICE_NAME, SERVICE_VERSION
from sentinel.storage.database import Database


def create_app(db_path: Optional[str] = None) -> FastAPI:
    """Application factory for AEGISX Sentinel backend."""
    db = Database(db_path=db_path)
    orchestrator = AgentOrchestrator(db)

    app = FastAPI(
        title=SERVICE_NAME,
        version=SERVICE_VERSION,
        description="AEGISX Sentinel — AI-Powered Cyber Evidence and Investigation System backend API.",
    )

    # Attach shared instances to state
    app.state.db = db
    app.state.orchestrator = orchestrator

    # Enable CORS for Chrome Extension (Manifest V3) and web dashboard clients
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handlers
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Internal Server Error",
                "detail": str(exc) if ENVIRONMENT == "development" else "An unexpected error occurred.",
            },
        )

    # Root information endpoint
    @app.get("/", summary="Root Health & Documentation Info")
    def root():
        return {
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION,
            "documentation": "/docs",
            "openapi": "/openapi.json",
            "status_endpoint": "/api/status",
        }

    # Mount API routes under /api
    app.include_router(api_router)

    return app


# Default application instance for uvicorn
app = create_app()
