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

    def classify(self, roi_input=None) -> Dict:
        """
        Simulate feature classification on a cropped ROI.

        Args:
            roi_input: Cropped ROI input. Can be PIL Image (legacy) or torch.Tensor.
                       Tensor shape: (3, 299, 299).
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
