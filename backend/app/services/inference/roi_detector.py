import os
import torch
import torchvision
from torchvision.models.detection import FasterRCNN_ResNet50_FPN_Weights
from typing import Dict, Optional
import numpy as np
from dotenv import load_dotenv

# Import preprocessing from the nearby service
from app.services.preprocessing.bbox_preprocessing import detection_preprocess_from_array

class FasterRCNNDetector:
    """
    Real Faster R-CNN ROI detector using ResNet101 backbone.
    (Singleton Pattern to avoid reloading model)
    """

    MODEL_NAME = "Faster R-CNN + ResNet101"
    MODEL_VERSION = "resnet101-thyroid-v1"
    
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FasterRCNNDetector, cls).__new__(cls)
        return cls._instance

    def __init__(self, model_path: str = None):
        # Only initialize once
        if self._model is None:
            # Explicitly load .env to ensure model path is available
            load_dotenv(override=True)
            
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model_path = model_path or os.getenv("FASTER_RCNN_MODEL_PATH")
            self._model = self._load_model()
            self._model.eval()

    def _load_model(self):
        """Simple model instantiator - using 2 classes (Background + Nodule)"""
        if not self.model_path:
            print("❌ Error: FASTER_RCNN_MODEL_PATH not found in environment.")
            # We must have a valid path to load the real model
            raise RuntimeError("FASTER_RCNN_MODEL_PATH is missing. Cannot perform real detection.")
        
        print(f"🚀 Initializing Faster R-CNN (Backbone: ResNet101)")
        print(f"📂 Weights Path: {self.model_path}")

        if not os.path.exists(self.model_path):
             raise FileNotFoundError(f"Faster R-CNN model file not found at {self.model_path}")
        
        # Determine model architecture
        # Most ResNet101 Faster R-CNNs in torchvision use this entry point
        if hasattr(torchvision.models.detection, 'fasterrcnn_resnet101_fpn'):
            model = torchvision.models.detection.fasterrcnn_resnet101_fpn(num_classes=2)
        else:
            # If not direct, we build it with a resnet101 backbone
            from torchvision.models.detection.backbone_utils import resnet_fpn_backbone
            from torchvision.models.detection import FasterRCNN
            backbone = resnet_fpn_backbone('resnet101', weights=None)
            model = FasterRCNN(backbone, num_classes=2)

        if os.path.exists(self.model_path):
            state_dict = torch.load(self.model_path, map_location=self.device)
            # Support both raw state_dicts and wrapped ones
            if "model_state_dict" in state_dict:
                state_dict = state_dict["model_state_dict"]
            elif "state_dict" in state_dict:
                state_dict = state_dict["state_dict"]
                
            model.load_state_dict(state_dict, strict=False)
            print("✅ Faster R-CNN model loaded.")
        else:
            raise FileNotFoundError(f"Faster R-CNN model file not found at {self.model_path}")
            
        return model.to(self.device)

    @torch.no_grad()
    def detect(self, image_array: np.ndarray) -> Dict:
        """
        Run detection on a single image.
        """
        h_orig, w_orig = image_array.shape[:2]
        
        # 1. Preprocess (CLAHE + Normalize)
        # Returns Tensor (3, H, W)
        tensor = detection_preprocess_from_array(image_array).to(self.device).unsqueeze(0)

        # 2. Forward pass
        outputs = self._model(tensor)[0]
        
        boxes = outputs["boxes"]
        scores = outputs["scores"]

        if len(scores) == 0:
            print("⚠️ Detection failed: No boxes found by model.")
            # Fallback to full image if nothing detected (safe default)
            return self._format_fallback(w_orig, h_orig)

        # 3. Pick highest confidence box
        max_idx = scores.argmax()
        max_score = scores[max_idx].item()
        
        print(f"🎯 Detection successful. Max score: {max_score:.4f}")

        # Threshold check
        CONF_THRESHOLD = 0.5
        if max_score < CONF_THRESHOLD:
            print(f"⚠️ Confidence too low ({max_score:.4f} < {CONF_THRESHOLD}). Using fallback.")
            return self._format_fallback(w_orig, h_orig)

        bbox = boxes[max_idx].cpu().numpy()
        xmin, ymin, xmax, ymax = bbox

        return {
            "bounding_box": {
                "xmin": float(xmin),
                "ymin": float(ymin),
                "xmax": float(xmax),
                "ymax": float(ymax),
            },
            "score": float(max_score),
            "image_width": w_orig,
            "image_height": h_orig,
            "format": "pascal_voc",
            "coordinate_space": "raw_image",
            "detector": {
                "name": self.MODEL_NAME,
                "version": self.MODEL_VERSION,
            },
        }

    def _format_fallback(self, w, h):
        """Returns a whole-image crop if detection fails."""
        return {
            "bounding_box": {"xmin": 0, "ymin": 0, "xmax": w, "ymax": h},
            "score": 0.0,
            "image_width": w,
            "image_height": h,
            "format": "pascal_voc",
            "coordinate_space": "raw_image",
            "detector": {"name": self.MODEL_NAME, "version": "fallback"}
        }

    def _format_fallback(self, w, h):
        """Returns a whole-image crop if detection fails."""
        return {
            "bounding_box": {"xmin": 0, "ymin": 0, "xmax": w, "ymax": h},
            "score": 0.0,
            "image_width": w,
            "image_height": h,
            "format": "pascal_voc",
            "coordinate_space": "raw_image",
            "detector": {"name": self.MODEL_NAME, "version": "fallback"}
        }
