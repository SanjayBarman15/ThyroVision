from fastapi import HTTPException
from app.db.supabase import supabase

def verify_user(token: str):
    try:
        res = supabase.auth.get_user(token)
        if res.user is None:
            raise HTTPException(status_code=401, detail="Invalid session")
        return res.user
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
