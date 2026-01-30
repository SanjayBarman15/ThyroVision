# Xception (mock now)

import random
from typing import Dict

class MockFeatureClassifier:
    """
    Mock Xception-based feature classifier.
    Operates on a cropped ROI (conceptually) and outputs
    thyroid ultrasound semantic features only.
    """

    MODEL_NAME = "xception"
    MODEL_VERSION = "mock-xception-v1"

    FEATURE_SPACE = {
        "composition": ["Cystic", "Spongiform", "Mixed", "Solid"],
        "echogenicity": ["Anechoic", "Isoechoic", "Hyperechoic", "Hypoechoic"],
        "margins": ["Smooth", "Ill-defined", "Irregular"],
        "calcifications": ["None", "Macrocalcifications", "Microcalcifications"],
        "shape": ["Wider-than-tall", "Taller-than-wide"],
    }

    def classify(self, roi_image=None) -> Dict:
        """
        Simulate feature classification on a cropped ROI.

        Args:
            roi_image: Placeholder for cropped ROI tensor/image
                       (not used in mock)

        Returns:
            Dict: Feature predictions + model metadata
        """

        features = {
            key: random.choice(values)
            for key, values in self.FEATURE_SPACE.items()
        }

        return {
            "features": features,
            "classifier": {
                "name": self.MODEL_NAME,
                "version": self.MODEL_VERSION,
            },
        }
