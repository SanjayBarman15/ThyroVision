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


class InferencePipeline:
    """
    End-to-end inference pipeline

    Flow:
    1. Load raw image
    2. ROI detection (Faster R-CNN)
    3. ROI crop (no resize, no normalization)
    4. Feature classification (Xception)
    5. TI-RADS rule engine
    6. Response assembly
    """

    PIPELINE_VERSION = "mock-pipeline-v1"

    def __init__(self):
        self.roi_detector = MockROIDetector()
        self.feature_classifier = MockFeatureClassifier()

    def run(self, image_bytes: bytes) -> Dict:
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
        # 2️⃣ ROI Detection (VOC format: xmin,ymin,xmax,ymax)
        # ─────────────────────────────────────────────
        roi_result = self.roi_detector.detect(
            image_width=image_width,
            image_height=image_height,
        )

        roi_voc = roi_result["bounding_box"]  # xyxy

        # ─────────────────────────────────────────────
        # 3️⃣ Convert ROI → xywh (frontend/backend format)
        # ─────────────────────────────────────────────
        bounding_box = xyxy_to_xywh({
            **roi_voc,
            "image_width": image_width,
            "image_height": image_height,
            "coordinate_space": "raw_image",
        })

        # ─────────────────────────────────────────────
        # 4️⃣ Crop ROI (NO resize)
        # ─────────────────────────────────────────────
        roi_image = img.crop((
            roi_voc["xmin"],
            roi_voc["ymin"],
            roi_voc["xmax"],
            roi_voc["ymax"],
        ))

        # ─────────────────────────────────────────────
        # 5️⃣ Feature Classification (Xception)
        # ─────────────────────────────────────────────
        feature_result = self.feature_classifier.classify(roi_image)
        features = feature_result["features"]

        # ─────────────────────────────────────────────
        # 6️⃣ TI-RADS Rule Engine (PURE, stateless)
        # ─────────────────────────────────────────────
        tirads_result = calculate_tirads(features)

        # ─────────────────────────────────────────────
        # 7️⃣ Final response
        # ─────────────────────────────────────────────
        inference_time_ms = int((time.time() - start_time) * 1000)

        return {
            "predicted_class": tirads_result["tirads"],
            "tirads": tirads_result["tirads"],
            "confidence": tirads_result["confidence"],

            "features": features,
            "bounding_box": bounding_box,

            "models": {
                "roi_detector": roi_result["detector"],
                "feature_classifier": feature_result["classifier"],
                "rule_engine": tirads_result["rule_engine"],
            },

            "pipeline_version": self.PIPELINE_VERSION,
            "inference_time_ms": inference_time_ms,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
