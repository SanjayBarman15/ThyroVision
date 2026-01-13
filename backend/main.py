from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.api.images import router as images_router
from app.api.patients import router as patients_router

load_dotenv()

app = FastAPI(title="ThyroVision Backend")

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

app.include_router(images_router)
app.include_router(patients_router)


@app.get("/")
async def health_check():
    return {"status": "ok"}
