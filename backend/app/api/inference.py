# backend/app/api/inference.py

from fastapi import APIRouter, Depends, HTTPException, Body, Request
from PIL import Image
import uuid
import io

from app.db.auth import verify_user
from app.db.supabase import supabase_admin, STORAGE_BUCKET
from app.services.inference.inference_pipeline import InferencePipeline
from app.utils.logger import log_event
from app.services.explainability.response_generator import ResponseGenerator

router = APIRouter(prefix="/inference", tags=["Inference"])
pipeline = InferencePipeline()


def convert_to_grayscale(image_bytes: bytes) -> bytes:
    """
    Optional preprocessing step.
    Converts uploaded ultrasound image to grayscale.
    """
    img = Image.open(io.BytesIO(image_bytes))
    gray = img.convert("L")

    out = io.BytesIO()
    gray.save(out, format="JPEG")
    return out.getvalue()


# ─────────────────────────────────────────────
# PRIMARY INFERENCE ENDPOINT (FAST - NO LLM)
# ─────────────────────────────────────────────

@router.post("/run")
async def run_inference(
    request: Request,
    image_id: uuid.UUID = Body(..., embed=True),
    user=Depends(verify_user)
):
    """
    Run ML inference pipeline on an uploaded raw image.

    - Fetch image
    - Run ROI + Feature classifier + TI-RADS engine
    - Store processed image
    - Save prediction (WITHOUT AI explanation)
    """

    # 1️⃣ Fetch raw image record
    res = (
        supabase_admin.table("raw_images")
        .select("*")
        .eq("id", str(image_id))
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

    # 3️⃣ Run inference pipeline (FAST LOCAL ML)
    try:
        inference = await pipeline.run(raw_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference pipeline failed: {str(e)}"
        )

    # 4️⃣ Optional preprocessing (grayscale)
    try:
        processed_bytes = convert_to_grayscale(raw_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Preprocessing failed: {str(e)}"
        )

    # 5️⃣ Build processed image storage path
    processed_path = (
        f"processed/{inference['pipeline_version']}/"
        f"class-{inference['tirads']}/"
        f"doctor_{raw_image['doctor_id']}/"
        f"patient_{raw_image['patient_id']}/"
        f"image_{image_id}.jpg"
    )

    # 6️⃣ Upload processed image
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

    # 6.5️⃣ Generate signed URL safely
    signed_url = None

    try:
        signed = bucket.create_signed_url(processed_path, 3600 * 24 * 7)

        if isinstance(signed, dict):
            signed_url = signed.get("signedURL") or signed.get("signed_url")
        else:
            signed_url = str(signed)

    except Exception as e:
        print(f"Signed URL generation failed: {e}")

    if not signed_url:
        signed_url = processed_path

    # 7️⃣ Insert processed_images record
    processed_image_id = str(uuid.uuid4())

    proc_res = supabase_admin.table("processed_images").insert({
        "id": processed_image_id,
        "raw_image_id": str(image_id),
        "file_path": processed_path,
        "file_url": signed_url
    }).execute()

    if not proc_res.data:
        raise HTTPException(status_code=500, detail="Failed to save processed image")

    # 8️⃣ Insert prediction (WITHOUT AI EXPLANATION)
    pred_res = supabase_admin.table("predictions").insert({
        "raw_image_id": str(image_id),
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

    # 9️⃣ System logging
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
        },
        error_code="INFERENCE_OK"
    )

    return {
        "success": True,
        "prediction": prediction,
        "bounding_box": inference["bounding_box"]
    }


# ─────────────────────────────────────────────
# ON-DEMAND AI EXPLANATION ENDPOINT
# ─────────────────────────────────────────────

@router.post("/{prediction_id}/explain")
async def generate_prediction_explanation(
    request: Request,
    prediction_id: uuid.UUID,
    use_llm: bool = Body(True, embed=True),
    user=Depends(verify_user)
):
    """
    Generate AI explanation for an existing prediction.

    - Uses Gemini if available (unless use_llm is False)
    - Falls back to rule-based explanation if quota limited
    - Caches explanation (does not regenerate if already exists)
    """

    # 1️⃣ Fetch prediction
    res = (
        supabase_admin.table("predictions")
        .select("*")
        .eq("id", str(prediction_id))
        .single()
        .execute()
    )

    prediction = res.data
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # 2️⃣ RETURN CACHED EXPLANATION IF EXISTS
    if prediction.get("ai_explanation"):
        return {
            "success": True,
            "prediction_id": str(prediction_id),
            "ai_explanation": prediction["ai_explanation"],
            "explanation_metadata": prediction.get("explanation_metadata")
        }

    # 3️⃣ Generate explanation via LLM or fallback
    try:
        result = await ResponseGenerator.generate(
            features=prediction["features"],
            tirads=prediction["tirads"],
            confidence=prediction["confidence"],
            use_llm=use_llm
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Explanation generation failed: {str(e)}"
        )

    # 4️⃣ Store explanation in DB
    supabase_admin.table("predictions").update({
        "ai_explanation": result["ai_explanation"],
        "explanation_metadata": result["explanation_metadata"]
    }).eq("id", str(prediction_id)).execute()

    # 5️⃣ Log explanation event
    log_event(
        level="INFO",
        action="GENERATE_EXPLANATION",
        request_id=request.state.request_id,
        actor_id=user.id,
        actor_role="doctor",
        resource_type="prediction",
        resource_id=str(prediction_id),
        metadata={
            "engine": result["explanation_metadata"]["engine"],
            "is_fallback": result["explanation_metadata"]["is_fallback"]
        },
        error_code="EXPLANATION_OK"
    )

    return {
        "success": True,
        "prediction_id": str(prediction_id),
        **result
    }
