import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.utils.logger import log_event
from app.api.images import router as images_router
from app.api.patients import router as patients_router
from app.api.inference import router as inference_router
from app.api.feedback import router as feedback_router
from app.api.logs import router as logs_router
from app.middleware.request_id import request_id_middleware

# ---------------------------
# Load environment variables (local dev only)
# Render env vars will override
# ---------------------------
load_dotenv(override=False)

# ---------------------------
# Logger (Uvicorn logger)
# ---------------------------
logger = logging.getLogger("uvicorn")

# ---------------------------
# FastAPI App
# ---------------------------
app = FastAPI(
    title="ThyroSight Backend",
    description="Backend API for Thyroid Ultrasound Analysis System",
    version=os.getenv("VERSION", "1.0.0")
)

# ---------------------------
# Register request ID middleware
# ---------------------------
app.middleware("http")(request_id_middleware)

# ---------------------------
# CORS Configuration
# ---------------------------
origins_env = os.getenv("CORS_ORIGINS", "")
origins = [o.strip() for o in origins_env.split(",") if o.strip()] if origins_env else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],   # fallback for local dev
    allow_credentials=bool(origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# API Routers
# ---------------------------
app.include_router(images_router)
app.include_router(patients_router)
app.include_router(inference_router)
app.include_router(feedback_router)
app.include_router(logs_router)

# ---------------------------
# Error Handlers
# ---------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", None)
    log_event(
        level="ERROR",
        action="VALIDATION_ERROR",
        request_id=req_id,
        error_message="Input validation failed",
        metadata={"errors": exc.errors()},
    )
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", None)
    log_event(
        level="FATAL",
        action="SERVER_ERROR",
        request_id=req_id,
        error_message=str(exc),
        metadata={"type": type(exc).__name__},
    )
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

# ---------------------------
# Health Check
# ---------------------------
@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "ThyroSight Backend",
        "version": os.getenv("VERSION", "1.0.0")
    }

# ---------------------------
# Startup Validation & Banner
# ---------------------------
@app.on_event("startup")
async def startup_validation():
    try:
        # Check required env vars
        required_envs = [
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
        ]
        missing = [env for env in required_envs if not os.getenv(env)]
        if missing:
            raise RuntimeError(f"Missing required environment variables: {missing}")

        # Banner info
        host = os.getenv("HOST", "127.0.0.1")
        port = os.getenv("PORT", "8000")
        version = os.getenv("VERSION", "1.0.0")
        render_url = os.getenv("RENDER_EXTERNAL_URL")

        logger.info("=================================")
        logger.info("ThyroSight Backend is running 🚀")
        logger.info("Status  : 200 OK ✅")
        logger.info("Service : ThyroSight Backend🏥")
        logger.info(f"Version : {version}")
        logger.info(f"URL     : {render_url or f'http://{host}:{port}'}")
        logger.info("=================================")

    except Exception as e:
        logger.error("❌ ThyroSight Backend failed to start")
        logger.error(str(e))
        raise  # re-raise so Render fails deployment
