from fastapi import APIRouter, Depends, HTTPException
from app.db.supabase import supabase_admin
from app.db.auth import verify_user
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from fastapi import Request
from app.utils.logger import log_event

router = APIRouter(prefix="/predictions", tags=["Feedback"])


# ============================
# Pydantic Schema
# ============================
class FeedbackSubmit(BaseModel):
    is_correct: bool
    corrected_tirads: Optional[int] = Field(None, ge=1, le=5)
    corrected_features: Optional[Dict[str, Any]] = None
    comments: Optional[str] = None


# ============================
# Submit Feedback
# ============================
@router.post("/{prediction_id}/feedback")
async def submit_feedback(
    prediction_id: str,
    feedback: FeedbackSubmit,
    request: Request,
    user=Depends(verify_user)
):
    # 1️⃣ Ensure prediction exists
    pred_res = supabase_admin.table("predictions") \
        .select("id, raw_image_id") \
        .eq("id", prediction_id) \
        .single() \
        .execute()

    prediction = pred_res.data
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # 2️⃣ Ownership check (doctor can only give feedback on their own cases)
    raw_res = supabase_admin.table("raw_images") \
        .select("doctor_id") \
        .eq("id", prediction["raw_image_id"]) \
        .single() \
        .execute()

    if not raw_res.data or raw_res.data["doctor_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to submit feedback")

    # 3️⃣ Prevent duplicate feedback
    existing = supabase_admin.table("prediction_feedback") \
        .select("id") \
        .eq("prediction_id", prediction_id) \
        .execute()

    if existing.data:
        raise HTTPException(
            status_code=400,
            detail="Feedback already submitted for this prediction"
        )

    # 4️⃣ Insert feedback
    feedback_data = {
        "prediction_id": prediction_id,
        "doctor_id": user.id,
        "is_correct": feedback.is_correct,
        "corrected_tirads": feedback.corrected_tirads,
        "corrected_features": feedback.corrected_features,
        "comments": feedback.comments
    }

    try:
        res = supabase_admin.table("prediction_feedback") \
            .insert(feedback_data) \
            .execute()
    except Exception as e:
        log_event(
            level="ERROR",
            action="SUBMIT_FEEDBACK_ERROR",
            request_id=request.state.request_id,
            actor_id=user.id,
            actor_role="doctor",
            resource_type="prediction",
            resource_id=prediction_id,
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to save feedback")

    saved_feedback = res.data[0]

    # 4.5️⃣ Log success
    log_event(
        level="INFO",
        action="SUBMIT_FEEDBACK",
        request_id=request.state.request_id,
        actor_id=user.id,
        actor_role="doctor",
        resource_type="prediction",
        resource_id=prediction_id,
        metadata={
            "is_correct": feedback.is_correct,
            "tirads": feedback.corrected_tirads
        }
    )

    # 5️⃣ Mark prediction as training candidate if incorrect
    if not feedback.is_correct:
        try:
            supabase_admin.table("predictions") \
                .update({"training_candidate": True}) \
                .eq("id", prediction_id) \
                .execute()
        except Exception as e:
            print("Warning: Failed to update training flag:", e)

    return {
        "success": True,
        "feedback": saved_feedback
    }


# ============================
# Get Feedback
# ============================
@router.get("/{prediction_id}/feedback")
async def get_feedback(
    prediction_id: str,
    user=Depends(verify_user)
):
    # 1️⃣ Check prediction exists
    pred_res = supabase_admin.table("predictions") \
        .select("id, raw_image_id") \
        .eq("id", prediction_id) \
        .single() \
        .execute()

    prediction = pred_res.data
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    # 2️⃣ Ownership check
    raw_res = supabase_admin.table("raw_images") \
        .select("doctor_id") \
        .eq("id", prediction["raw_image_id"]) \
        .single() \
        .execute()

    if not raw_res.data or raw_res.data["doctor_id"] != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view feedback")

    # 3️⃣ Fetch feedback
    res = supabase_admin.table("prediction_feedback") \
        .select("*") \
        .eq("prediction_id", prediction_id) \
        .execute()

    if not res.data:
        return {"success": True, "feedback": None}

    return {
        "success": True,
        "feedback": res.data[0]
    }
