# from fastapi import APIRouter, Header, HTTPException
# from app.db.supabase import supabase
# from app.db.auth import verify_user
# from pydantic import BaseModel
# from typing import Optional


# router = APIRouter(prefix="/patients", tags=["Patients"])

# class PatientCreate(BaseModel):
#     first_name: str
#     last_name: str
#     dob: str
#     gender: str
#     past_medical_data: Optional[str] = None

# @router.post("/")
# async def create_patient(
#     patient: PatientCreate,
#     authorization: str = Header(...)
# ):
#     # 1️⃣ Verify Supabase user
#     if not authorization.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Missing Authorization header")

#     token = authorization.replace("Bearer ", "")
#     user = verify_user(token)
#     doctor_id = user.id

#     # 2️⃣ Insert Patient Record
#     res = supabase.table("patients").insert({
#         "doctor_id": doctor_id,
#         "first_name": patient.first_name,
#         "last_name": patient.last_name,
#         "dob": patient.dob,
#         "gender": patient.gender,
#         "past_medical_data": patient.past_medical_data
#     }).execute()

#     if not res.data:
#         raise HTTPException(status_code=500, detail="Failed to create patient record")

#     return {
#         "success": True,
#         "patient": res.data[0]
#     }


from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase import supabase_admin
from app.db.auth import verify_user
from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from app.utils.logger import log_event

router = APIRouter(prefix="/patients", tags=["Patients"])

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    dob: str
    gender: str
    past_medical_data: Optional[str] = None

@router.post("/")
async def create_patient(
    patient: PatientCreate,
    request: Request,
    user=Depends(verify_user)
):
    doctor_id = user.id

    res = supabase_admin.table("patients").insert({
        "doctor_id": doctor_id,
        "first_name": patient.first_name,
        "last_name": patient.last_name,
        "dob": patient.dob,
        "gender": patient.gender,
        "past_medical_data": patient.past_medical_data
    }).execute()

    new_patient = res.data[0]

    # 3️⃣ Log event
    log_event(
        level="INFO",
        action="CREATE_PATIENT",
        request_id=request.state.request_id,
        actor_id=user.id,
        actor_role="doctor",
        resource_type="patient",
        resource_id=new_patient["id"],
        metadata={
            "first_name": patient.first_name,
            "last_name": patient.last_name
        }
    )

    return {"success": True, "patient": new_patient}
