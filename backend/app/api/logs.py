from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.db.supabase import supabase_admin
from app.utils.logger import LOGGING_ENABLED
import os

router = APIRouter(prefix="/api/logs", tags=["System Logs"])

@router.get("/config")
async def get_logs_config():
    """
    Returns the current logging configuration status.
    """
    return {
        "logging_enabled": LOGGING_ENABLED
    }

@router.get("")
async def get_logs(
    level: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = Query(50, ge=1, le=1000),
    offset: int = 0
):
    """
    Fetch system logs with optional filtering.
    """
    if not LOGGING_ENABLED:
        return {"logs": [], "total": 0, "message": "Logging is currently disabled."}

    try:
        query = supabase_admin.table("system_logs").select("*", count="exact").order("created_at", desc=True)

        if level and level != "ALL":
            query = query.eq("level", level.upper())
        
        if action and action != "ALL":
            query = query.eq("action", action)

        # Pagination
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        return {
            "logs": result.data,
            "total": result.count,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
