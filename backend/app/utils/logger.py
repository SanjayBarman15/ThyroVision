# backend/app/utils/logger.py

import os
import uuid
from typing import Optional, Dict, Any
from app.db.supabase import supabase_admin


LOGGING_ENABLED = os.getenv("SYSTEM_LOGGING_ENABLED", "false").lower() == "true"

def log_event(
    *,
    level: str,
    action: str,
    request_id: Optional[uuid.UUID] = None,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    error_code: Optional[str] = None,
    error_message: Optional[str] = None,
    exception: Optional[Exception] = None,
):
    try:
        if not LOGGING_ENABLED:
            return

        # Auto-extract from exception if provided
        if exception:
            if not error_message:
                error_message = str(exception)
            if not error_code:
                # If it's a FastAPI/Starlette HTTPException, use status_code as error_code
                if hasattr(exception, "status_code"):
                    error_code = str(exception.status_code)
                else:
                    error_code = type(exception).__name__

        # 1. Enforce uppercase to match Supabase CHECK constraint ('INFO','WARN','ERROR','FATAL')
        level_clean = level.upper()

        # 2. Default status code for successes
        if level_clean == "INFO" and not error_code:
            error_code = "OK"

        # 3. Prepare payload
        final_request_id = request_id or uuid.uuid4()
        
        payload = {
            "level": level_clean,
            "action": action,
            "actor_id": actor_id,
            "actor_role": actor_role,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "request_id": str(final_request_id),
            "metadata": metadata,
            "error_code": error_code,
            "error_message": error_message,
        }

        # 3. Insert and ignore failures (don't break API if logging fails)
        supabase_admin.table("system_logs").insert(payload).execute()
    except Exception as e:
        print(f"Logging Error: {e}") # Print to console for debugging
        pass
