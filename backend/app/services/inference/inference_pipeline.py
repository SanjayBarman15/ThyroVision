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
import numpy as np
from app.services.preprocessing.feature_preprocessing import xception_preprocess_from_array


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
        # 3️⃣ Preprocessing (Real Xception Logic)
        # ─────────────────────────────────────────────
        # We use the raw image and the ROI from Step 2.
        # The preprocessing function handles cropping, resizing (299x299),
        # and normalization (-1 to 1).
        
        # Convert PIL to Numpy (RGB)
        image_array = np.array(img)
        
        # Extract bbox as list [xmin, ymin, xmax, ymax]
        bbox_list = [
            roi_voc["xmin"],
            roi_voc["ymin"],
            roi_voc["xmax"],
            roi_voc["ymax"]
        ]
        
        try:
            # Result is a torch.Tensor (1, 3, 299, 299) if batched or (3, 299, 299)
            # The function returns (3, 299, 299)
            roi_tensor = xception_preprocess_from_array(image_array, bbox_list)
        except Exception as e:
            # Fallback if crop fails (e.g. edge case)
            raise RuntimeError(f"Preprocessing failed: {str(e)}")

        # ─────────────────────────────────────────────
        # 4️⃣ Feature Classification (Xception)
        # ─────────────────────────────────────────────
        feature_result = self.feature_classifier.classify(roi_tensor)
        features = feature_result["features"]

        # ─────────────────────────────────────────────
        # 5️⃣ TI-RADS Rule Engine (PURE, stateless)
        # ─────────────────────────────────────────────
        tirads_result = calculate_tirads(features)

        # ─────────────────────────────────────────────
        # 6️⃣ AI Explanation (Gemini)
        # ─────────────────────────────────────────────
        ai_result = await ResponseGenerator.generate(
            features=features,
            tirads=tirads_result["tirads"],
            confidence=tirads_result["confidence"]
        )

        # ─────────────────────────────────────────────
        # 7️⃣ Final response
        # ─────────────────────────────────────────────
        inference_time_ms = int((time.time() - start_time) * 1000)

        # Mock TI-RADS confidences (will be replaced by real Xception model output)
        # Format matches xception_output_format.json: all_tirads_probabilities
        tirads_confidences = {
            "TIRADS_1": 0.05,
            "TIRADS_2": 0.10,
            "TIRADS_3": 0.70,
            "TIRADS_4": 0.10,
            "TIRADS_5": 0.05
        }
        # Boost the predicted class confidence
        tirads_confidences[f"TIRADS_{tirads_result['tirads']}"] = tirads_result["confidence"]

        return {
            "predicted_class": tirads_result["tirads"],
            "tirads": tirads_result["tirads"],
            "confidence": tirads_result["confidence"],
            "tirads_confidences": tirads_confidences,

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
