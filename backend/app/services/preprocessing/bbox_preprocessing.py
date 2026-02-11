import cv2
import numpy as np
import torch
from typing import List

def detection_preprocess(image_path: str) -> torch.Tensor:
    """
    EXACT MATCH TO TRAINING PREPROCESSING

    This function mirrors the notebook pipeline:
    - cv2.imread (BGR)
    - BGR → RGB
    - Convert to tensor
    - Scale to [0,1]

    Args:
        image_path: Path to ultrasound image

    Returns:
        torch.Tensor: (3, H, W) normalized tensor
    """
    # 1. Read image exactly like training
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found or invalid: {image_path}")

    # 2. Convert BGR → RGB (same as notebook)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # 3. Convert to float and scale to [0,1]
    img = img.astype(np.float32) / 255.0

    # 4. Convert to PyTorch tensor (C, H, W)
    tensor = torch.from_numpy(img).permute(2, 0, 1)

    return tensor


def detection_preprocess_from_array(image_array: np.ndarray) -> torch.Tensor:
    """
    Same logic but for numpy array input (web uploads / API)

    Args:
        image_array: H×W×3 numpy array

    Returns:
        torch.Tensor: (3, H, W)
    """
    # Ensure RGB format (if coming from frontend)
    if len(image_array.shape) == 3:
        img = image_array
    else:
        raise ValueError("Input image must have 3 channels (H×W×3)")

    img = img.astype(np.float32) / 255.0
    tensor = torch.from_numpy(img).permute(2, 0, 1)

    return tensor


def batch_preprocess_detection(image_paths: List[str]) -> List[torch.Tensor]:
    """Preprocess multiple images exactly like training."""
    return [detection_preprocess(p) for p in image_paths]


if __name__ == "__main__":
    print("Detection Preprocessing Loaded (TRAINING MATCH MODE)")
    print("- No CLAHE")
    print("- No Grayscale")
    print("- RGB format only")
    print("- Normalization: [0,1]")
