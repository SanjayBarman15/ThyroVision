# orchestration
# app/services/inference/pipeline.py

import time
from datetime import datetime
from typing import Dict
from PIL import Image
from io import BytesIO

from app.services.inference.roi_detector import MockROIDetector
from app.services.inference.feature_classifier import MockFeatureClassifier
from app.services.rules.tirads import calculate_tirads
from app.services.inference.box_utils import xyxy_to_xywh, map_box_to_raw_image
from app.services.explainability.response_generator import ResponseGenerator


class InferencePipeline:
    """
    End-to-end inference pipeline

    Flow:
    1. Load raw image
    2. SIMULATE: Focal Crop (Fixed input 512x512)
    3. ROI detection (Faster R-CNN) on crop
    4. Coordinate Remapping (Crop -> Raw Image)
    5. Feature classification (Xception)
    6. TI-RADS rule engine
    7. Response assembly
    """

    PIPELINE_VERSION = "mock-pipeline-v2-simulation"

    def __init__(self):
        self.roi_detector = MockROIDetector()
        self.feature_classifier = MockFeatureClassifier()

    async def run(self, image_bytes: bytes) -> Dict:
        start_time = time.time()

        # ─────────────────────────────────────────────
        # 1️⃣ Load raw image
        # ─────────────────────────────────────────────
        try:
            img = Image.open(BytesIO(image_bytes)).convert("RGB")
            image_width, image_height = img.size
        except Exception as e:
            raise RuntimeError(f"Failed to load image: {str(e)}")

        # ─────────────────────────────────────────────
        # 2️⃣ SIMULATION: Focus Window (Pre-processing)
        # ─────────────────────────────────────────────
        # We simulate that the model requires a 512x512 input crop.
        # We take a central focal crop to simulate the "Nodule Focus"
        MODEL_INPUT_SIZE = 512
        
        crop_w = min(MODEL_INPUT_SIZE, image_width)
        crop_h = min(MODEL_INPUT_SIZE, image_height)
        
        offset_x = (image_width - crop_w) // 2
        offset_y = (image_height - crop_h) // 2

        # ─────────────────────────────────────────────
        # 3️⃣ ROI Detection (ON THE CROP)
        # ─────────────────────────────────────────────
        roi_result = self.roi_detector.detect(
            image_width=crop_w,
            image_height=crop_h,
        )

        roi_voc_local = roi_result["bounding_box"]  # xyxy local to crop

        # ─────────────────────────────────────────────
        # 4️⃣ Coordinate Transformation (Local -> Raw)
        # ─────────────────────────────────────────────
        box_local_xywh = xyxy_to_xywh({
            **roi_voc_local,
            "image_width": crop_w,
            "image_height": crop_h,
        })

        bounding_box = map_box_to_raw_image(
            box=box_local_xywh,
            offset_x=offset_x,
            offset_y=offset_y,
            scale_factor=1.0, 
            raw_w=image_width,
            raw_h=image_height
        )

        # ─────────────────────────────────────────────
        # 5️⃣ Crop ROI for Classification
        # ─────────────────────────────────────────────
        # Still need the actual crop for the feature classifier
        roi_image = img.crop((
            roi_voc_local["xmin"] + offset_x,
            roi_voc_local["ymin"] + offset_y,
            roi_voc_local["xmax"] + offset_x,
            roi_voc_local["ymax"] + offset_y,
        ))

        # ─────────────────────────────────────────────
        # 6️⃣ Feature Classification (Xception)
        # ─────────────────────────────────────────────
        feature_result = self.feature_classifier.classify(roi_image)
        features = feature_result["features"]

        # ─────────────────────────────────────────────
        # 7️⃣ TI-RADS Rule Engine (PURE, stateless)
        # ─────────────────────────────────────────────
        tirads_result = calculate_tirads(features)

        # ─────────────────────────────────────────────
        # 8️⃣ AI Explanation (Gemini)
        # ─────────────────────────────────────────────
        ai_result = await ResponseGenerator.generate(
            features=features,
            tirads=tirads_result["tirads"],
            confidence=tirads_result["confidence"]
        )

        # ─────────────────────────────────────────────
        # 9️⃣ Final response
        # ─────────────────────────────────────────────
        inference_time_ms = int((time.time() - start_time) * 1000)

        return {
            "predicted_class": tirads_result["tirads"],
            "tirads": tirads_result["tirads"],
            "confidence": tirads_result["confidence"],

            "features": features,
            "bounding_box": bounding_box,
            
            "ai_explanation": ai_result["ai_explanation"],
            "explanation_metadata": ai_result["explanation_metadata"],

            "models": {
                "roi_detector": roi_result["detector"],
                "feature_classifier": feature_result["classifier"],
                "rule_engine": tirads_result["rule_engine"],
                "explainer": ai_result["explanation_metadata"]["engine"]
            },

            "pipeline_version": self.PIPELINE_VERSION,
            "inference_time_ms": inference_time_ms,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
