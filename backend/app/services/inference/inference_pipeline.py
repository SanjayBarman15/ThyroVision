# orchestration
# app/services/inference/pipeline.py

import time
import os
from datetime import datetime
from typing import Dict
from PIL import Image
from io import BytesIO

from app.services.inference.roi_detector import FasterRCNNDetector
from app.services.inference.feature_classifier import FeatureClassifier
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
    2. ROI detection (Faster R-CNN) on crop
    3. Coordinate Remapping (optional if on raw)
    4. Feature classification (Xception Multi-Output)
    5. TI-RADS rule engine (ACR Point System)
    6. Response assembly & pruning
    """

    PIPELINE_VERSION = "production-pipeline-v1-xception"

    def __init__(self):
        self.roi_detector = FasterRCNNDetector()
        self.feature_classifier = FeatureClassifier()

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

        # 2️⃣ ROI Detection (Real Faster R-CNN)
        # ─────────────────────────────────────────────
        # Convert PIL to Numpy for detector (detects on raw RGB pixels)
        image_array = np.array(img)
        
        roi_result = self.roi_detector.detect(image_array)

        roi_voc = roi_result["bounding_box"]  # xyxy in raw image space
        
        # Format for API response and DB (xywh)
        final_bounding_box = xyxy_to_xywh({
            **roi_voc,
            "image_width": image_width,
            "image_height": image_height,
            "coordinate_space": "raw_image"
        })

        # 3️⃣ Xception Preprocessing
        # ─────────────────────────────────────────────
        
        # Extract bbox as list [xmin, ymin, xmax, ymax]
        bbox_list = [
            roi_voc["xmin"],
            roi_voc["ymin"],
            roi_voc["xmax"],
            roi_voc["ymax"]
        ]
        
        try:
            # Result is a torch.Tensor (3, 299, 299)
            roi_tensor = xception_preprocess_from_array(image_array, bbox_list)
        except Exception as e:
            raise RuntimeError(f"Preprocessing failed: {str(e)}")

        # ─────────────────────────────────────────────
        # 4️⃣ Feature Classification (Xception Multi-Output)
        # ─────────────────────────────────────────────
        # This returns features (strings) and feature_results (full metadata)
        class_result = self.feature_classifier.classify(roi_tensor)
        feature_metadata = class_result["feature_results"]

        # ─────────────────────────────────────────────
        # 5️⃣ TI-RADS Rule Engine (Official ACR Points)
        # ─────────────────────────────────────────────
        tirads_result = calculate_tirads(feature_metadata)

        # ─────────────────────────────────────────────
        # 6️⃣ AI Explanation (Gemini)
        # ─────────────────────────────────────────────
        ai_result = await ResponseGenerator.generate(
            features=class_result["features"],
            tirads=tirads_result["tirads"],
            confidence=tirads_result["confidence"]
        )

        # ─────────────────────────────────────────────
        # 7️⃣ Data Pruning & Final Response
        # ─────────────────────────────────────────────
        inference_time_ms = int((time.time() - start_time) * 1000)

        # Build essential features object for database (cleaning the ML output)
        pruned_features = {
            "clinical_features": tirads_result["breakdown"],
            "total_points": tirads_result["total_points"],
            "measurements": {
                "nodule_area_relative": round((roi_voc["xmax"] - roi_voc["xmin"]) * (roi_voc["ymax"] - roi_voc["ymin"]) / (image_width * image_height), 4)
            }
        }

        # Extract real TI-RADS classification from the model's distribution head
        tirads_confidences = class_result.get("tirads_confidences", {})
        
        if tirads_confidences:
            # Find the class with the highest probability
            # keys are "TIRADS_1", "TIRADS_2", etc.
            predicted_tirads_key = max(tirads_confidences, key=tirads_confidences.get)
            final_tirads = int(predicted_tirads_key.split("_")[1])
            final_confidence = round(float(tirads_confidences[predicted_tirads_key]), 4)
        else:
            # Fallback to rule engine if distribution is missing
            final_tirads = tirads_result["tirads"]
            final_confidence = tirads_result["confidence"]

        return {
            "predicted_class": final_tirads,
            "tirads": final_tirads,
            "confidence": final_confidence,
            "tirads_confidences": tirads_confidences,

            "features": pruned_features,
            "bounding_box": final_bounding_box, # BBox from R-CNN
            "roi_score": roi_result.get("score", 0.0),
            
            "ai_explanation": ai_result["ai_explanation"],
            "explanation_metadata": {
                **ai_result["explanation_metadata"],
                "gradcam_available": True,
                "grad_cam_data": class_result.get("grad_cam_data")
            },

            "models": {
                "roi_detector": roi_result["detector"],
                "feature_classifier": class_result["classifier"],
                "rule_engine": tirads_result["rule_engine"],
                "explainer": ai_result["explanation_metadata"]["engine"]
            },

            "pipeline_version": self.PIPELINE_VERSION,
            "inference_time_ms": inference_time_ms,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
