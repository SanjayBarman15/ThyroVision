# from fastapi import HTTPException
# from app.db.supabase import supabase

# def verify_user(token: str):
#     try:
#         res = supabase.auth.get_user(token)
#         if res.user is None:
#             raise HTTPException(status_code=401, detail="Invalid session")
#         return res.user
#     except Exception as e:
#         raise HTTPException(status_code=401, detail=str(e))

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db.supabase import supabase_auth

security = HTTPBearer()

def verify_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        res = supabase_auth.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return res.user

    except Exception:
        raise HTTPException(status_code=401, detail="Unauthorized")
