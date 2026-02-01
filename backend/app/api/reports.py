#app/api/reports.py
from fastapi import APIRouter, HTTPException, Response
from app.db.supabase import supabase_admin, STORAGE_BUCKET
from app.services.reports.pdf_generator import PDFReportGenerator

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/pdf/{prediction_id}")
async def export_pdf(prediction_id: str):

    # 1️⃣ Fetch prediction
    res = (
        supabase_admin.table("predictions")
        .select("*")
        .eq("id", prediction_id)
        .single()
        .execute()
    )

    if not res.data:
        raise HTTPException(404, "Prediction not found")

    pred = res.data

    # 2️⃣ Fetch raw image record
    raw_res = (
        supabase_admin.table("raw_images")
        .select("*")
        .eq("id", pred["raw_image_id"])
        .single()
        .execute()
    )

    if not raw_res.data:
        raise HTTPException(404, "Raw image not found")
        
    raw_image = raw_res.data

    # 3️⃣ Fetch Patient details
    patient_res = (
        supabase_admin.table("patients")
        .select("*")
        .eq("id", raw_image["patient_id"])
        .single()
        .execute()
    )
    
    patient = patient_res.data if patient_res.data else {}
    name = f"{patient.get('first_name', 'Unknown')} {patient.get('last_name', '')}".strip() or "N/A"

    # 4️⃣ Download raw image bytes
    try:
        bucket = supabase_admin.storage.from_(STORAGE_BUCKET)
        image_bytes = bucket.download(raw_image["file_path"])
    except Exception as e:
        raise HTTPException(500, f"Failed to download image: {str(e)}")

    # 5️⃣ Generate PDF
    pdf_bytes = PDFReportGenerator.generate_pdf(
        data={
            "patient": {
                "name": name,
                "age": str(patient.get("age", "N/A")),
                "gender": patient.get("gender", "N/A"),
                "date": raw_image.get("created_at", "").split("T")[0]
            },
            "prediction": pred
        },
        raw_image_bytes=image_bytes
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=report_{prediction_id}.pdf"
        }
    )
