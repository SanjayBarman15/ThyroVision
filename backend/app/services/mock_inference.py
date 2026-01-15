# backend/app/services/mock_inference.py

import random
import time
from datetime import datetime
from typing import Dict

class MockInferenceService:
    MODEL_VERSION = "mock-v1"

    CONFIDENCE_BY_TIRADS = {
        1: (0.85, 0.95),
        2: (0.80, 0.92),
        3: (0.70, 0.88),
        4: (0.82, 0.94),
        5: (0.90, 0.99),
    }

    FEATURE_OPTIONS = {
        "composition": ["Cystic", "Spongiform", "Mixed", "Solid"],
        "echogenicity": ["Anechoic", "Isoechoic", "Hyperechoic", "Hypoechoic"],
        "margins": ["Smooth", "Ill-defined", "Irregular"],
        "calcifications": ["None", "Macrocalcifications", "Microcalcifications"],
        "shape": ["Wider-than-tall", "Taller-than-wide"],
    }

    def run(self, raw_image_path: str) -> Dict:
        start = time.time()

        time.sleep(random.uniform(0.25, 0.6))
        inference_time_ms = int((time.time() - start) * 1000)

        # 1️⃣ Generate detected features
        features = {
            "composition": random.choice(self.FEATURE_OPTIONS["composition"]),
            "echogenicity": random.choice(self.FEATURE_OPTIONS["echogenicity"]),
            "margins": random.choice(self.FEATURE_OPTIONS["margins"]),
            "calcifications": random.choice(self.FEATURE_OPTIONS["calcifications"]),
            "shape": random.choice(self.FEATURE_OPTIONS["shape"]),
        }

        # 2️⃣ Infer TI-RADS from features (simple rule-based logic)
        tirads = 1

        if features["composition"] == "Solid":
            tirads += 1
        if features["echogenicity"] == "Hypoechoic":
            tirads += 1
        if features["margins"] == "Irregular":
            tirads += 1
        if features["calcifications"] == "Microcalcifications":
            tirads += 1
        if features["shape"] == "Taller-than-wide":
            tirads += 1

        tirads = min(tirads, 5)
        predicted_class = tirads  # matches your DB schema

        conf_min, conf_max = self.CONFIDENCE_BY_TIRADS[tirads]
        confidence = round(random.uniform(conf_min, conf_max), 2)

        # Generate a bounding box always for now (for verification)
        bounding_box = {
            "x": random.randint(80, 160),
            "y": random.randint(60, 140),
            "width": random.randint(140, 260),
            "height": random.randint(120, 240),
        }

        return {
            "predicted_class": predicted_class,
            "tirads": tirads,
            "confidence": confidence,
            "features": features,   # 🔥 THIS is what you asked for
            "bounding_box": bounding_box,
            "model_version": self.MODEL_VERSION,
            "inference_time_ms": inference_time_ms,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
