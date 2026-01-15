# backend/app/services/mock_inference.py

import random
import time
from datetime import datetime
from typing import Dict

class MockInferenceService:
    """
    Simulates ML inference without using any ML framework.
    Can be replaced later by a real model with zero API changes.
    """

    MODEL_VERSION = "mock-v1"

    CONFIDENCE_BY_TIRADS = {
        1: (0.85, 0.95),
        2: (0.80, 0.92),
        3: (0.70, 0.88),
        4: (0.82, 0.94),
        5: (0.90, 0.99),
    }

    def run(self, raw_image_path: str) -> Dict:
        start = time.time()

        # Simulate inference latency
        time.sleep(random.uniform(0.25, 0.6))

        inference_time_ms = int((time.time() - start) * 1000)

        tirads = random.randint(1, 5)
        predicted_class = tirads - 1

        conf_min, conf_max = self.CONFIDENCE_BY_TIRADS[tirads]
        confidence = round(random.uniform(conf_min, conf_max), 2)

        bounding_box = None
        if tirads >= 3:
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
            "bounding_box": bounding_box,
            "model_version": self.MODEL_VERSION,
            "inference_time_ms": inference_time_ms,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }
