# backend/app/middleware/request_id.py

import uuid
from fastapi import Request

async def request_id_middleware(request: Request, call_next):
    request_id = uuid.uuid4()
    request.state.request_id = request_id

    response = await call_next(request)
    response.headers["X-Request-ID"] = str(request_id)
    return response
