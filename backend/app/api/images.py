from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException
import uuid
from app.db.supabase import supabase
from app.db.auth import verify_user

router = APIRouter(prefix="/images", tags=["Images"])


@router.post("/upload-raw")
async def upload_raw_image(
    patient_id: str = Form(...),
    file: UploadFile = File(...),
    authorization: str = Header(...)
):
    # 1️⃣ Verify Supabase user
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = authorization.replace("Bearer ", "")
    user = verify_user(token)
    doctor_id = user.id

    # 2️⃣ Validate file
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")

    # 3️⃣ Generate storage path
    image_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1]
    file_path = f"{doctor_id}/{patient_id}/{image_id}.{ext}"

    file_bytes = await file.read()

    try:
        # 4️⃣ Upload to Supabase Storage
        supabase.storage.from_("thyrovision-images").upload(
            file_path,
            file_bytes,
            {"content-type": file.content_type}
        )

        # 5️⃣ Generate signed URL (temporary access)
        # Note: In newer supabase-py versions, create_signed_url returns the URL string directly
        signed_url = supabase.storage.from_("thyrovision-images").create_signed_url(
            file_path,
            600  # 10 minutes
        )
        
        # If it returns a dict (older/some versions), extract it
        if isinstance(signed_url, dict):
            signed_url = signed_url.get("signedURL") or signed_url.get("signed_url")

    except Exception as e:
        print(f"Storage error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Storage operation failed: {str(e)}")

    # 6️⃣ Insert DB record (RAW image)
    supabase.table("raw_images").insert({
        "id": image_id,
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "file_path": file_path,
        "file_url": signed_url
    }).execute()

    return {
        "success": True,
        "image_id": image_id,
        "image_url": signed_url
    }
