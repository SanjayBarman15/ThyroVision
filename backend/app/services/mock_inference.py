# backend/app/services/mock_inference.py

import random
import time
from datetime import datetime
from typing import Dict

class MockInferenceService:
    """
    Mock inference service to simulate AI model behavior.
    This can be replaced later with a real ML model without
    changing API or database logic.
    """

    MODEL_VERSION = "mock-v1"

    def run(self, raw_image_path: str) -> Dict:
        """
        Simulate inference on a thyroid ultrasound image.
        """

        start_time = time.time()

        # Simulate compute delay (realistic)
        time.sleep(random.uniform(0.25, 0.6))

        inference_time_ms = int((time.time() - start_time) * 1000)

        tirads = random.choice([1, 2, 3, 4, 5])

        result = {
            "tirads": tirads,
            "confidence": round(random.uniform(0.78, 0.96), 2),
            "bounding_box": {
                "x": random.randint(80, 160),
                "y": random.randint(60, 140),
                "width": random.randint(140, 260),
                "height": random.randint(120, 240),
            },
            "processed_image_path": self._generate_processed_path(raw_image_path),
            "model_version": self.MODEL_VERSION,
            "inference_time_ms": inference_time_ms,
            "created_at": datetime.utcnow().isoformat() + "Z",
        }

        return result

    def _generate_processed_path(self, raw_path: str) -> str:
        """
        Convert raw image path to processed image path
        """
        if "raw" in raw_path:
            return raw_path.replace("raw", "processed")
        return f"processed/{raw_path.split('/')[-1]}"
