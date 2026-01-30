# backend/app/api/inference.py

from fastapi import APIRouter, Depends, HTTPException, Body, Request
from PIL import Image
import uuid
import io

from app.db.auth import verify_user
from app.db.supabase import supabase_admin, STORAGE_BUCKET
from app.services.inference.pipeline import InferencePipeline
from app.utils.logger import log_event

router = APIRouter(prefix="/inference", tags=["Inference"])
pipeline = InferencePipeline()


def convert_to_grayscale(image_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    gray = img.convert("L")

    out = io.BytesIO()
    gray.save(out, format="JPEG")
    return out.getvalue()


@router.post("/run")
async def run_inference(
    request: Request,
    image_id: str = Body(..., embed=True),
    user=Depends(verify_user)
):
    # 1️⃣ Fetch raw image record
    res = (
        supabase_admin.table("raw_images")
        .select("*")
        .eq("id", image_id)
        .single()
        .execute()
    )

    raw_image = res.data
    if not raw_image:
        raise HTTPException(status_code=404, detail="Raw image not found")

    # 2️⃣ Download raw image bytes from Supabase Storage
    bucket = supabase_admin.storage.from_(STORAGE_BUCKET)
    try:
        raw_bytes = bucket.download(raw_image["file_path"])
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download image: {str(e)}"
        )

    # 3️⃣ Run inference on IMAGE BYTES (modular pipeline)
    inference = pipeline.run(raw_bytes)

    # 4️⃣ OPTIONAL preprocessing (grayscale)
    try:
        processed_bytes = convert_to_grayscale(raw_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Preprocessing failed: {str(e)}"
        )

    # 5️⃣ Build processed image path
    processed_path = (
        f"processed/{inference['pipeline_version']}/"
        f"class-{inference['tirads']}/"
        f"doctor_{raw_image['doctor_id']}/"
        f"patient_{raw_image['patient_id']}/"
        f"image_{image_id}.jpg"
    )

    # 6️⃣ Upload processed image (optional – you may remove later)
    try:
        bucket.upload(
            processed_path,
            processed_bytes,
            {"content-type": "image/jpeg"}
        )
    except Exception as e:
        if "already exists" not in str(e).lower():
            raise HTTPException(
                status_code=500,
                detail=f"Processed storage upload failed: {str(e)}"
            )

    # 6.5️⃣ Signed URL
    try:
        signed_url = bucket.create_signed_url(processed_path, 3600 * 24 * 7)
        if isinstance(signed_url, dict):
            signed_url = signed_url.get("signedURL") or signed_url.get("signed_url")
    except Exception:
        signed_url = processed_path

    # 7️⃣ Insert processed_images record
    processed_image_id = str(uuid.uuid4())
    proc_res = supabase_admin.table("processed_images").insert({
        "id": processed_image_id,
        "raw_image_id": image_id,
        "file_path": processed_path,
        "file_url": signed_url
    }).execute()

    if not proc_res.data:
        raise HTTPException(status_code=500, detail="Failed to save processed image")

    # 8️⃣ Insert prediction with metadata
    pred_res = supabase_admin.table("predictions").insert({
        "raw_image_id": image_id,
        "predicted_class": inference["predicted_class"],
        "tirads": inference["tirads"],
        "confidence": inference["confidence"],
        "model_version": inference["pipeline_version"],
        "model_metadata": inference["models"],
        "inference_time_ms": inference["inference_time_ms"],
        "features": inference["features"],
        "bounding_box": inference["bounding_box"],
        "processed_image_id": processed_image_id,
        "training_candidate": False
    }).execute()

    if not pred_res.data:
        raise HTTPException(status_code=500, detail="Failed to save prediction")

    prediction = pred_res.data[0]

    # 9️⃣ System log
    log_event(
        level="INFO",
        action="MODEL_INFERENCE",
        request_id=request.state.request_id,
        actor_id=user.id,
        actor_role="doctor",
        resource_type="prediction",
        resource_id=prediction["id"],
        metadata={
            "tirads": inference["tirads"],
            "confidence": inference["confidence"],
            "inference_time_ms": inference["inference_time_ms"]
        }
    )

    return {
        "success": True,
        "prediction": prediction,
        "bounding_box": inference["bounding_box"]
    }
