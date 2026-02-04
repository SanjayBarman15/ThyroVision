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
from app.services.inference.box_utils import xyxy_to_xywh
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
        # 2️⃣ ROI Detection (Faster R-CNN)
        # ─────────────────────────────────────────────
        # Detect on the full raw image
        roi_result = self.roi_detector.detect(
            image_width=image_width,
            image_height=image_height,
        )

        roi_voc = roi_result["bounding_box"]  # xyxy in raw image space
        
        # Format for API response (xywh)
        bounding_box = xyxy_to_xywh({
            **roi_voc,
            "image_width": image_width,
            "image_height": image_height,
            "coordinate_space": "raw_image"
        })

        # ─────────────────────────────────────────────
        # 3️⃣ Draw Bounding Box (Visual Guide for Xception)
        # ─────────────────────────────────────────────
        # The Xception model was trained with visual bounding boxes as features.
        # We must draw the box on the image before cropping.
        
        from PIL import ImageDraw
        
        # Create a mutable copy to draw on
        img_with_box = img.copy()
        draw = ImageDraw.Draw(img_with_box)
        
        # Draw red rectangle (width=3 to be visible but not overwhelming)
        draw.rectangle(
            [roi_voc["xmin"], roi_voc["ymin"], roi_voc["xmax"], roi_voc["ymax"]],
            outline="red",
            width=3
        )

        # ─────────────────────────────────────────────
        # 4️⃣ Expand Box (Padding for Context)
        # ─────────────────────────────────────────────
        # We need to capture some context around the nodule, not just the nodule itself.
        # Expand the box by 20%
        
        PADDING_FACTOR = 0.20
        box_w = roi_voc["xmax"] - roi_voc["xmin"]
        box_h = roi_voc["ymax"] - roi_voc["ymin"]
        
        pad_x = int(box_w * PADDING_FACTOR)
        pad_y = int(box_h * PADDING_FACTOR)
        
        # Calculate expanded coordinates, ensuring we stay within image bounds
        crop_xmin = max(0, roi_voc["xmin"] - pad_x)
        crop_ymin = max(0, roi_voc["ymin"] - pad_y)
        crop_xmax = min(image_width, roi_voc["xmax"] + pad_x)
        crop_ymax = min(image_height, roi_voc["ymax"] + pad_y)
        
        # ─────────────────────────────────────────────
        # 5️⃣ Crop & Resize (Pre-processing for Xception)
        # ─────────────────────────────────────────────
        # Crop the expanded region (which contains the drawn box)
        roi_image = img_with_box.crop((crop_xmin, crop_ymin, crop_xmax, crop_ymax))
        
        # Resize to fixed input size for Xception
        MODEL_INPUT_SIZE = (224, 224)
        roi_image = roi_image.resize(MODEL_INPUT_SIZE, Image.Resampling.BILINEAR)

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
