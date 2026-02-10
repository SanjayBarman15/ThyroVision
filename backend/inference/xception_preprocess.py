# xception_preprocess.py

"""
Xception Preprocessing for PyTorch
===================================

Golden preprocessing function for Xception model.
Works for: Training, Validation, Testing, Backend Inference, Web App

Requirements:
- Input size: 299 × 299 × 3
- Input type: float32
- Color: RGB
- Normalization: Xception-style → [-1, 1]
- Input tensor: (C, H, W)
- ⚠️ Do NOT use ImageNet mean/std for Xception
"""

import cv2
import numpy as np
import torch


def crop_roi(image, bbox):
    """
    Crop Region of Interest (ROI) from image using bounding box.
    
    Args:
        image: H×W×3 RGB numpy array
        bbox: [xmin, ymin, xmax, ymax] bounding box coordinates
        
    Returns:
        roi: Cropped image region
        
    Raises:
        ValueError: If ROI crop results in empty image
    """
    x1, y1, x2, y2 = map(int, bbox)

    # Clamp bbox to image boundaries
    h, w, _ = image.shape
    x1 = max(0, min(x1, w - 1))
    x2 = max(1, min(x2, w))
    y1 = max(0, min(y1, h - 1))
    y2 = max(1, min(y2, h))

    roi = image[y1:y2, x1:x2]

    if roi.size == 0:
        raise ValueError("Invalid ROI crop - resulted in empty image")

    return roi


def xception_preprocess(image_path, bbox):
    """
    🌟 GOLDEN XCEPTION PREPROCESSING FUNCTION 🌟
    
    This is the ONLY preprocessing function the Xception team should use.
    
    Works for:
    - Training
    - Validation
    - Testing
    - Backend inference
    - Web app
    
    Args:
        image_path: Path to input image file
        bbox: [xmin, ymin, xmax, ymax] bounding box for ROI
        
    Returns:
        torch.Tensor: Preprocessed image tensor of shape (3, 299, 299)
                     normalized to [-1, 1] range using Xception normalization
                     
    Raises:
        FileNotFoundError: If image file doesn't exist
        ValueError: If ROI crop is invalid
        
    Example:
        >>> bbox = [100, 80, 200, 180]
        >>> tensor = xception_preprocess("nodule.png", bbox)
        >>> tensor.shape
        torch.Size([3, 299, 299])
        >>> tensor.min(), tensor.max()
        (tensor(-1.0), tensor(1.0))
    """
    # Load image
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {image_path}")

    # Convert BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    # Crop ROI
    roi = crop_roi(img, bbox)

    # Resize to Xception input size (299×299)
    roi = cv2.resize(roi, (299, 299), interpolation=cv2.INTER_LINEAR)

    # Convert to float32
    roi = roi.astype(np.float32)

    # Xception normalization → [-1, 1]
    # ⚠️ Do NOT use ImageNet mean/std
    roi = roi / 127.5 - 1.0

    # Convert to PyTorch tensor (C, H, W)
    roi = torch.from_numpy(roi).permute(2, 0, 1)

    return roi


def xception_preprocess_from_array(image_array, bbox):
    """
    Preprocess from numpy array instead of file path.
    Useful for web applications and real-time inference.
    
    Args:
        image_array: H×W×3 RGB numpy array
        bbox: [xmin, ymin, xmax, ymax] bounding box for ROI
        
    Returns:
        torch.Tensor: Preprocessed image tensor of shape (3, 299, 299)
    """
    # Crop ROI
    roi = crop_roi(image_array, bbox)

    # Resize to Xception input size (299×299)
    roi = cv2.resize(roi, (299, 299), interpolation=cv2.INTER_LINEAR)

    # Convert to float32
    roi = roi.astype(np.float32)

    # Xception normalization → [-1, 1]
    roi = roi / 127.5 - 1.0

    # Convert to PyTorch tensor (C, H, W)
    roi = torch.from_numpy(roi).permute(2, 0, 1)

    return roi


def batch_preprocess(image_paths, bboxes):
    """
    Preprocess multiple images in batch.
    
    Args:
        image_paths: List of image file paths
        bboxes: List of bounding boxes [[xmin, ymin, xmax, ymax], ...]
        
    Returns:
        torch.Tensor: Batch of preprocessed images (B, 3, 299, 299)
    """
    tensors = []
    for img_path, bbox in zip(image_paths, bboxes):
        tensor = xception_preprocess(img_path, bbox)
        tensors.append(tensor)
    
    # Stack into batch (B, 3, 299, 299)
    batch = torch.stack(tensors, dim=0)
    return batch


if __name__ == "__main__":
    # Example usage
    print("Xception Preprocessing Configuration:")
    print("=" * 50)
    print("Input size: 299 × 299 × 3")
    print("Input type: float32")
    print("Color space: RGB")
    print("Normalization: Xception-style → [-1, 1]")
    print("Formula: (pixel / 127.5) - 1.0")
    print("Output tensor: (C, H, W)")
    print("⚠️ Do NOT use ImageNet mean/std")
    print("=" * 50)
