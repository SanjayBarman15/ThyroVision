import cv2
import numpy as np
import torch
from typing import Union, List

def apply_clahe(img: np.ndarray) -> np.ndarray:
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization) to a grayscale image.
    """
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(img)

def detection_preprocess(image_path: str) -> torch.Tensor:
    """
    🌟 GOLDEN DETECTION PREPROCESSING FUNCTION 🌟
    
    Standardizes ultrasound images for the Faster R-CNN model.
    Steps: Grayscale -> CLAHE -> 3-Channel BGR -> Normalize [0,1] -> Tensor (C,H,W)
    
    Args:
        image_path: Path to the raw ultrasound image.
        
    Returns:
        torch.Tensor: Normalized tensor of shape (3, H, W) in range [0, 1].
    """
    # 1. Load image (Grayscale as per ML team's golden logic)
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Image not found or invalid: {image_path}")

    return _process_common(img)

def detection_preprocess_from_array(image_array: np.ndarray) -> torch.Tensor:
    """
    Preprocess from numpy array (useful for web requests/real-time).
    
    Args:
        image_array: H×W×3 or H×W numpy array.
        
    Returns:
        torch.Tensor: Normalized tensor of shape (3, H, W).
    """
    if len(image_array.shape) == 3:
        # Convert to grayscale if it's a color image
        img = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    else:
        img = image_array

    return _process_common(img)

def _process_common(img: np.ndarray) -> torch.Tensor:
    """Shared logic for CLAHE, normalization, and tensor conversion."""
    # 2. CLAHE contrast enhancement
    img = apply_clahe(img)

    # 3. Convert back to 3-channel (Detection model expects 3 channels)
    # Note: ML team used BGR conversion in their script
    img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)

    # 4. Scale to [0, 1]
    img = img.astype(np.float32) / 255.0

    # 5. Convert to PyTorch tensor (C, H, W)
    tensor = torch.from_numpy(img).permute(2, 0, 1)

    return tensor

def batch_preprocess_detection(image_paths: List[str]) -> List[torch.Tensor]:
    """Preprocess a list of images for detection."""
    return [detection_preprocess(p) for p in image_paths]


if __name__ == "__main__":
    # Quick sanity check logic
    print("Detection Preprocessing Service Loaded.")
    print("- Logic: CLAHE + Normalization [0,1]")
    print("- Target: Faster R-CNN + ResNet101")
