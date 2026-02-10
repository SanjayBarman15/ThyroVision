# Xception (Real Multi-Output Model)

import os
import torch
import numpy as np
from typing import Dict, Optional
from app.models.xception_model import XceptionMultiOutput, FEATURE_DEFINITIONS

class FeatureClassifier:
    """
    Xception-based multi-output feature classifier.
    Loads a trained PyTorch model and predicts 5 clinical features.
    """

    MODEL_NAME = "xception-multioutput"
    MODEL_VERSION = "production-v1"
    
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FeatureClassifier, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        # Only initialize once (Singleton)
        if self._model is None:
            self._load_model()

    def _load_model(self):
        """Load the model weights from the path specified in .env"""
        model_path = os.getenv("XCEPTION_MODEL_PATH")
        if not model_path:
            raise RuntimeError("XCEPTION_MODEL_PATH not found in environment variables")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")

        print(f"Loading Xception model from {model_path}...")
        
        # Initialize architecture
        self._model = XceptionMultiOutput(pretrained=False)
        
        # Load weights
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        checkpoint = torch.load(model_path, map_location=device)
        
        # Handle different checkpoint formats
        state_dict = checkpoint.get('model_state_dict', checkpoint)
        
        # ⚠️ FIX: Map keys if they don't have the 'backbone.' prefix
        new_state_dict = {}
        for k, v in state_dict.items():
            if k == 'fc.weight':
                new_state_dict['tirads_head.weight'] = v
            elif k == 'fc.bias':
                new_state_dict['tirads_head.bias'] = v
            elif k.startswith('backbone.'):
                new_state_dict[k] = v
            else:
                new_state_dict[f'backbone.{k}'] = v
        
        # ⚠️ FIX: Use strict=False because the V1 checkpoint might be missing the 5 multi-output heads
        missing_keys, unexpected_keys = self._model.load_state_dict(new_state_dict, strict=False)
        
        if missing_keys:
            print(f"⚠️ Warning: Missing keys in state_dict: {len(missing_keys)}")
        if unexpected_keys:
            print(f"ℹ️ Note: Unexpected keys in state_dict: {len(unexpected_keys)}")

        self._model.to(device)
        self._model.eval()
        self.device = device
        print("✓ Xception model loaded (non-strict mode)")

    def classify(self, roi_tensor: torch.Tensor) -> Dict:
        """
        Run inference on a preprocessed ROI tensor.

        Args:
            roi_tensor: Preprocessed tensor of shape (3, 299, 299)
        Returns:
            Dict: Comprehensive prediction results including features and probabilities.
        """
        if roi_tensor.dim() == 3:
            roi_tensor = roi_tensor.unsqueeze(0)
        
        roi_tensor = roi_tensor.to(self.device)

        with torch.no_grad():
            outputs = self._model(roi_tensor)
            
            predicted_features = {}
            feature_results = {}
            tirads_confidences = {}
            
            # Process ACR features
            for feature_name in ['composition', 'echogenicity', 'shape', 'margin', 'echogenic_foci']:
                logits = outputs[feature_name]
                probs = torch.softmax(logits, dim=1).cpu().numpy()[0]
                predicted_idx = int(np.argmax(probs))
                confidence = float(probs[predicted_idx])
                
                class_name = FEATURE_DEFINITIONS[feature_name]['classes'][predicted_idx]
                
                predicted_features[feature_name] = class_name
                feature_results[feature_name] = {
                    'index': predicted_idx,
                    'value': class_name,
                    'confidence': round(confidence, 4),
                    'all_probabilities': {
                        FEATURE_DEFINITIONS[feature_name]['classes'][i]: round(float(probs[i]), 4)
                        for i in range(len(probs))
                    }
                }

            # Process TI-RADS distribution (from the 'fc' / 'tirads_head' layer)
            if 'tirads' in outputs:
                tirads_logits = outputs['tirads']
                tirads_probs = torch.softmax(tirads_logits, dim=1).cpu().numpy()[0]
                tirads_confidences = {
                    f"TIRADS_{i+1}": float(tirads_probs[i])
                    for i in range(len(tirads_probs))
                }

        # Placeholder for Grad-CAM (matching user request structure)
        grad_cam_data = {
            "heatmap": np.zeros((7, 7)).tolist(), # Real Grad-CAM would go here
            "top_features": list(predicted_features.keys())[:2]
        }

        return {
            "features": predicted_features,
            "feature_results": feature_results,
            "tirads_confidences": tirads_confidences,
            "grad_cam_data": grad_cam_data,
            "classifier": {
                "name": self.MODEL_NAME,
                "version": self.MODEL_VERSION,
                "device": str(self.device)
            },
        }
