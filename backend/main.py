from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv

from app.api.images import router as images_router
from app.api.patients import router as patients_router
from app.api.inference import router as inference_router

# ---------------------------
# Load environment variables
# ---------------------------
load_dotenv()

# ---------------------------
# Logger (Uvicorn logger)
# ---------------------------
logger = logging.getLogger("uvicorn")

# ---------------------------
# FastAPI App
# ---------------------------
app = FastAPI(
    title="ThyroVision Backend",
    description="Backend API for Thyroid Ultrasound Analysis System",
    version="1.0.0"
)

# ---------------------------
# CORS Configuration
# ---------------------------
origins_env = os.getenv("CORS_ORIGINS", "")
origins = (
    [o.strip() for o in origins_env.split(",") if o.strip()]
    if origins_env else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# API Routers
# ---------------------------
app.include_router(images_router)
app.include_router(patients_router)
app.include_router(inference_router)

# ---------------------------
# Health Check
# ---------------------------
@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "ThyroVision Backend",
        "version": "1.0.0"
    }

# ---------------------------
# Startup Validation & Banner
# ---------------------------
@app.on_event("startup")
async def startup_validation():
    # Validate required environment variables
    required_envs = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
    ]
    missing = [env for env in required_envs if not os.getenv(env)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")

    # Server info
    host = os.getenv("HOST", "127.0.0.1")
    port = os.getenv("PORT", "8000")

    # Startup banner (best possible timing)
    logger.info("")
    logger.info("=================================")
    logger.info("ThyroVision Backend is running 🚀")
    logger.info("Status  : 200 OK")
    logger.info("Service : ThyroVision Backend")
    logger.info("Version : 1.0.0")
    logger.info(f"URL     : http://{host}:{port}")
    # logger.info(f"Docs    : http://{host}:{port}/docs")
    logger.info("=================================")
    logger.info("")
