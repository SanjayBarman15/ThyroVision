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
        Returns the best bounding box after filtering.

        Args:
            image_width (int): Width of the raw image
            image_height (int): Height of the raw image

        Returns:
            Dict: Bounding box metadata
        """

        # ---------------------------------------------------------
        # 1. Simulate Raw Model Output
        #    Faster R-CNN returns: Dict[Tensor]
        #    - boxes: [N, 4] (xmin, ymin, xmax, ymax)
        #    - scores: [N] (0.0 to 1.0)
        #    - labels: [N] (int class IDs)
        # ---------------------------------------------------------
        
        # We simulate N random detections
        num_detections = random.randint(3, 8)
        raw_outputs = []
        
        for _ in range(num_detections):
            # Random box size (10% to 30% of image)
            w_box = int(image_width * random.uniform(0.1, 0.3))
            h_box = int(image_height * random.uniform(0.1, 0.3))
            
            x_min = random.randint(0, max(0, image_width - w_box))
            y_min = random.randint(0, max(0, image_height - h_box))
            x_max = x_min + w_box
            y_max = y_min + h_box
            
            score = random.uniform(0.0, 0.99) # Spread scores
            label = 1 # Example class ID
            
            raw_outputs.append({
                "box": [x_min, y_min, x_max, y_max],
                "score": score,
                "label": label
            })

        # ---------------------------------------------------------
        # 2. Post-Processing (The "Glue" Code)
        # ---------------------------------------------------------
        
        # A. Score Threshold Filtering
        SCORE_THRESHOLD = 0.5
        filtered_detections = [
            d for d in raw_outputs 
            if d["score"] >= SCORE_THRESHOLD
        ]
        
        # Fallback if no boxes found (for mock purposes, force one)
        if not filtered_detections:
            filtered_detections = raw_outputs[:1]
            if not filtered_detections: # Should be impossible given loop above but safe
                 filtered_detections.append({
                    "box": [0, 0, 100, 100], "score": 0.1, "label": 1
                })

        # B. Select Best Box (Highest Score)
        # In a real app, you might use NMS (Non-Max Suppression) here if multiple boxes overlap
        best_detection = max(filtered_detections, key=lambda x: x["score"])

        # C. Format for Pipeline
        # Extract xyxy coordinates
        xmin, ymin, xmax, ymax = best_detection["box"]

        return {
            "bounding_box": {
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
            },
            "score": best_detection["score"],
            "image_width": image_width,
            "image_height": image_height,
            "format": "pascal_voc", # Explicitly stating xyxy
            "coordinate_space": "raw_image",
            "detector": {
                "name": self.MODEL_NAME,
                "version": self.MODEL_VERSION,
            },
        }
