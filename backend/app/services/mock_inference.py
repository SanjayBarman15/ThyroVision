# backend/app/services/mock_inference.py

import random
import time
from datetime import datetime
from typing import Dict
from PIL import Image
from io import BytesIO


class MockInferenceService:
    MODEL_VERSION = "mock-v2"

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

    def run(self, image_bytes: bytes) -> Dict:
        start = time.time()

        # ✅ Load image from BYTES (not path)
        try:
            img = Image.open(BytesIO(image_bytes))
            img = img.convert("RGB")
            image_width, image_height = img.size
        except Exception as e:
            raise RuntimeError(f"Failed to load image for inference: {str(e)}")

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

        # 2️⃣ Infer TI-RADS
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
        predicted_class = tirads

        conf_min, conf_max = self.CONFIDENCE_BY_TIRADS[tirads]
        confidence = round(random.uniform(conf_min, conf_max), 2)

        # 3️⃣ Generate bounding box RELATIVE TO IMAGE SIZE
        box_width = int(image_width * random.uniform(0.15, 0.3))
        box_height = int(image_height * random.uniform(0.15, 0.3))
        x = random.randint(0, image_width - box_width)
        y = random.randint(0, image_height - box_height)

        bounding_box = {
            "x": x,
            "y": y,
            "width": box_width,
            "height": box_height,
            "image_width": image_width,
            "image_height": image_height,
            "format": "xywh",
            "coordinate_space": "raw_image",
        }

        return {
            "predicted_class": predicted_class,
            "tirads": tirads,
            "confidence": confidence,
            "features": features,
            "bounding_box": bounding_box,
            "model_version": self.MODEL_VERSION,
            "inference_time_ms": inference_time_ms,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
