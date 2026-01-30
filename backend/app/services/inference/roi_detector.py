# Faster R-CNN + ResNet50 (mock)
import random
from typing import Dict

class MockROIDetector:
    """
    Mock Faster R-CNN ROI detector.
    Outputs bounding box in Pascal VOC format:
    (xmin, ymin, xmax, ymax)
    """

    MODEL_NAME = "faster-rcnn + resnet50"
    MODEL_VERSION = "mock-fasterrcnn-resnet50-v1"

    def detect(self, image_width: int, image_height: int) -> Dict:
        """
        Simulate ROI detection on a raw ultrasound image.

        Args:
            image_width (int): Width of the raw image
            image_height (int): Height of the raw image

        Returns:
            Dict: Bounding box metadata
        """

        # ROI size proportional to image (15%–30%)
        box_width = int(image_width * random.uniform(0.15, 0.30))
        box_height = int(image_height * random.uniform(0.15, 0.30))

        xmin = random.randint(0, max(0, image_width - box_width))
        ymin = random.randint(0, max(0, image_height - box_height))

        xmax = xmin + box_width
        ymax = ymin + box_height

        return {
            "bounding_box": {
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
            },
            "image_width": image_width,
            "image_height": image_height,
            "format": "pascal_voc",
            "coordinate_space": "raw_image",
            "detector": {
                "name": self.MODEL_NAME,
                "version": self.MODEL_VERSION,
            },
        }
