"""
PyTorch Multi-Output Xception Inference with Comprehensive JSON Output
======================================================================

Inference for the multi-output model that predicts 5 TIRADS features
and calculates TIRADS category from those features.

Works with models trained using xception_multioutput_model.py
"""

import os
import json
import torch
import cv2
import numpy as np
from datetime import datetime
from xception_preprocess import xception_preprocess
import xml.etree.ElementTree as ET


# Import feature definitions from multioutput model
from xception_multioutput_model import (
    XceptionMultiOutput,
    FEATURE_DEFINITIONS,
    calculate_tirads_from_features
)


# TIRADS to clinical recommendation mapping
TIRADS_INFO = {
    1: {
        "category": "TR1 - Benign",
        "risk_level": "Benign",
        "malignancy_risk": "0%",
        "suggested_action": "NO_ACTION",
        "fna_threshold_mm": None,
        "followup_threshold_mm": None,
        "recommendation_text": "No FNA or follow-up required"
    },
    2: {
        "category": "TR2 - Not Suspicious",
        "risk_level": "Not suspicious",
        "malignancy_risk": "0%",
        "suggested_action": "NO_ACTION",
        "fna_threshold_mm": None,
        "followup_threshold_mm": None,
        "recommendation_text": "No FNA or follow-up required"
    },
    3: {
        "category": "TR3 - Mildly Suspicious",
        "risk_level": "Mildly suspicious",
        "malignancy_risk": "<5%",
        "suggested_action": "FOLLOW_UP",
        "fna_threshold_mm": 25,
        "followup_threshold_mm": 15,
        "recommendation_text": "FNA if ≥2.5 cm, follow-up if ≥1.5 cm"
    },
    4: {
        "category": "TR4 - Moderately Suspicious",
        "risk_level": "Moderately suspicious",
        "malignancy_risk": "5-20%",
        "suggested_action": "FNA_RECOMMENDED",
        "fna_threshold_mm": 15,
        "followup_threshold_mm": 10,
        "recommendation_text": "FNA if ≥1.5 cm, follow-up if ≥1.0 cm"
    },
    5: {
        "category": "TR5 - Highly Suspicious",
        "risk_level": "Highly suspicious",
        "malignancy_risk": ">20%",
        "suggested_action": "URGENT_REFERRAL",
        "fna_threshold_mm": 10,
        "followup_threshold_mm": 5,
        "recommendation_text": "FNA if ≥1.0 cm, follow-up if ≥0.5 cm"
    }
}


def load_multioutput_model(checkpoint_path, device='cpu', dropout_rate=0.3):
    """Load trained multi-output Xception model from checkpoint."""
    model = XceptionMultiOutput(pretrained=False, dropout_rate=dropout_rate)
    
    checkpoint = torch.load(checkpoint_path, map_location=device)
    
    # Handle different checkpoint formats
    if 'model_state_dict' in checkpoint:
        model.load_state_dict(checkpoint['model_state_dict'])
    else:
        model.load_state_dict(checkpoint)
    
    model.to(device)
    model.eval()
    return model


def parse_xml(xml_path):
    """Parse XML to get bbox."""
    tree = ET.parse(xml_path)
    root = tree.getroot()
    bbox_elem = root.find("object/bndbox")
    if bbox_elem is None:
        raise ValueError(f"No bounding box found in XML: {xml_path}")
    
    def get_int_from_elem(elem, tag):
        child = elem.find(tag)
        if child is None or child.text is None:
            raise ValueError(f"Missing or empty <{tag}> in XML: {xml_path}")
        return int(float(child.text))
    
    xmin = get_int_from_elem(bbox_elem, "xmin")
    ymin = get_int_from_elem(bbox_elem, "ymin")
    xmax = get_int_from_elem(bbox_elem, "xmax")
    ymax = get_int_from_elem(bbox_elem, "ymax")
    return [xmin, ymin, xmax, ymax]


def get_image_shape(image_path):
    """Get image dimensions."""
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    return [img.shape[1], img.shape[0]]


def calculate_nodule_measurements(bbox, image_path=None, pixel_spacing=0.1):
    """
    Calculate nodule measurements from bounding box and image pixels.
    
    Args:
        bbox: [xmin, ymin, xmax, ymax]
        image_path: Path to image for intensity analysis (optional)
        pixel_spacing: Physical spacing in mm/pixel (default 0.1 mm/px)
    
    Returns:
        Dictionary with size, area, volume, intensity stats, and shape orientation
    """
    xmin, ymin, xmax, ymax = bbox
    
    width = xmax - xmin
    height = ymax - ymin
    
    max_dimension = max(width, height)
    min_dimension = min(width, height)
    
    # Physical measurements (convert pixels to mm)
    area_mm2 = width * height * (pixel_spacing ** 2)
    volume_mm3 = area_mm2 * min_dimension * pixel_spacing
    
    measurements = {
        "max_dimension_mm": round(max_dimension * pixel_spacing, 1),
        "min_dimension_mm": round(min_dimension * pixel_spacing, 1),
        "width_mm": round(width * pixel_spacing, 1),
        "height_mm": round(height * pixel_spacing, 1),
        "area_mm2": round(area_mm2, 1),
        "volume_mm3": round(volume_mm3, 1),
        "aspect_ratio": round(height / width if width > 0 else 1.0, 3),
        "is_taller_than_wide": height > width
    }
    
    # If image provided, calculate intensity statistics
    if image_path is not None:
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is not None:
                roi = img[ymin:ymax, xmin:xmax]
                
                measurements["intensity_stats"] = {
                    "mean": round(float(np.mean(roi)), 2),
                    "std": round(float(np.std(roi)), 2),
                    "min": int(np.min(roi)),
                    "max": int(np.max(roi)),
                    "median": round(float(np.median(roi)), 2)
                }
                
                # Calculate histogram (10 bins)
                hist, bins = np.histogram(roi.flatten(), bins=10, range=(0, 256))
                measurements["intensity_histogram"] = {
                    f"bin_{i}": int(hist[i]) for i in range(len(hist))
                }
        except Exception as e:
            measurements["intensity_stats"] = {"error": f"Failed to calculate: {str(e)}"}
    
    return measurements


def get_feature_description(feature_name, feature_idx):
    """Get human-readable description for feature."""
    descriptions = {
        'composition': {
            0: "Cystic or almost completely cystic",
            1: "Spongiform (>50% cystic)",
            2: "Mixed cystic and solid",
            3: "Solid or almost completely solid",
            4: "Partially cystic with solid components"
        },
        'echogenicity': {
            0: "Anechoic (cystic, no echoes)",
            1: "Hyperechoic (brighter than thyroid)",
            2: "Isoechoic (same as thyroid)",
            3: "Hypoechoic (darker than thyroid)",
            4: "Very hypoechoic (darker than strap muscles)"
        },
        'shape': {
            0: "Wider than tall (horizontal orientation)",
            1: "Taller than wide (vertical orientation, suspicious)"
        },
        'margin': {
            0: "Smooth margins",
            1: "Ill-defined margins",
            2: "Lobulated margins",
            3: "Irregular margins",
            4: "Extra-thyroidal extension (very suspicious)"
        },
        'echogenic_foci': {
            0: "None or large comet-tail artifacts",
            1: "Macrocalcifications",
            2: "Peripheral (rim) calcifications",
            3: "Punctate echogenic foci",
            4: "Microcalcifications (highly suspicious)"
        }
    }
    
    return descriptions.get(feature_name, {}).get(feature_idx, "Unknown")


def run_multioutput_inference(model, image_path, bbox, roi_id, device='cpu'):
    """
    Run inference with multi-output model and generate comprehensive JSON output.
    
    Returns:
        Dictionary with predicted features and calculated TIRADS category
    """
    
    # Preprocess image
    tensor = xception_preprocess(image_path, bbox)
    tensor = tensor.unsqueeze(0).to(device)
    
    # Run inference
    with torch.no_grad():
        outputs = model(tensor)
        
        # Get predicted feature indices
        predicted_features = {}
        feature_confidences = {}
        
        for feature_name, output_tensor in outputs.items():
            probs = torch.softmax(output_tensor, dim=1).cpu().numpy()[0]
            predicted_idx = int(np.argmax(probs))
            confidence = float(probs[predicted_idx])
            
            predicted_features[feature_name] = predicted_idx
            feature_confidences[feature_name] = {
                'predicted_index': predicted_idx,
                'predicted_value': FEATURE_DEFINITIONS[feature_name]['classes'][predicted_idx],
                'confidence': round(confidence, 4),
                'all_probabilities': {
                    FEATURE_DEFINITIONS[feature_name]['classes'][i]: round(float(probs[i]), 4)
                    for i in range(len(probs))
                }
            }
        
        # Calculate TIRADS from predicted features
        tirads_category, total_points = calculate_tirads_from_features(predicted_features)
        
        # Get measurements (including intensity stats from image)
        measurements = calculate_nodule_measurements(bbox, image_path=image_path)
        
        # Get TIRADS info
        tirads_info = TIRADS_INFO[tirads_category]
        
        # Build comprehensive feature descriptions
        tirads_features = {}
        for feature_name, feature_idx in predicted_features.items():
            feature_value = FEATURE_DEFINITIONS[feature_name]['classes'][feature_idx]
            feature_points = FEATURE_DEFINITIONS[feature_name]['points'][feature_idx]
            
            tirads_features[feature_name] = {
                "type": feature_value,
                "description": get_feature_description(feature_name, feature_idx),
                "points": feature_points,
                "confidence": feature_confidences[feature_name]['confidence'],
                "all_probabilities": feature_confidences[feature_name]['all_probabilities']
            }
        
        # Add shape metrics to shape feature
        tirads_features['shape']['aspect_ratio'] = measurements['aspect_ratio']
        tirads_features['shape']['is_taller_than_wide'] = measurements['is_taller_than_wide']
        
        # Build comprehensive output
        comprehensive_output = {
            "roi_id": roi_id,
            "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            
            "classification": {
                "predicted_tirads": f"TIRADS_{tirads_category}",
                "tirads_category": tirads_category,
                "calculated_from_features": True,
                "total_points": total_points,
                "confidence_score": round(
                    np.mean([fc['confidence'] for fc in feature_confidences.values()]), 4
                )
            },
            
            "predicted_features": {
                feat: {
                    "value": feature_confidences[feat]['predicted_value'],
                    "index": feature_confidences[feat]['predicted_index'],
                    "confidence": feature_confidences[feat]['confidence']
                }
                for feat in predicted_features.keys()
            },
            
            "feature_probabilities": feature_confidences,
            
            "nodule_measurements": measurements,
            
            "tirads_features": tirads_features,
            
            "tirads_points_breakdown": {
                "composition": FEATURE_DEFINITIONS['composition']['points'][predicted_features['composition']],
                "echogenicity": FEATURE_DEFINITIONS['echogenicity']['points'][predicted_features['echogenicity']],
                "shape": FEATURE_DEFINITIONS['shape']['points'][predicted_features['shape']],
                "margin": FEATURE_DEFINITIONS['margin']['points'][predicted_features['margin']],
                "echogenic_foci": FEATURE_DEFINITIONS['echogenic_foci']['points'][predicted_features['echogenic_foci']],
                "total": total_points
            },
            
            "clinical_recommendation": {
                "tirads_category": tirads_info["category"],
                "risk_level": tirads_info["risk_level"],
                "malignancy_risk": tirads_info["malignancy_risk"],
                "suggested_action": tirads_info["suggested_action"],
                "fna_threshold_mm": tirads_info["fna_threshold_mm"],
                "followup_threshold_mm": tirads_info["followup_threshold_mm"],
                "recommendation_text": tirads_info["recommendation_text"],
                "nodule_size_mm": measurements["max_dimension_mm"],
                "meets_fna_criteria": (
                    tirads_info["fna_threshold_mm"] is not None and
                    measurements["max_dimension_mm"] >= tirads_info["fna_threshold_mm"]
                ),
                "meets_followup_criteria": (
                    tirads_info["followup_threshold_mm"] is not None and
                    measurements["max_dimension_mm"] >= tirads_info["followup_threshold_mm"]
                )
            },
            
            "detection_metadata": {
                "bbox": bbox,
                "original_size": get_image_shape(image_path)
            },
            
            "model_info": {
                "architecture": "Xception Multi-Output",
                "num_outputs": 5,
                "output_heads": list(FEATURE_DEFINITIONS.keys()),
                "tirads_calculation": "ACR TI-RADS point system",
                "framework": "PyTorch"
            }
        }
        
        return comprehensive_output


def save_json(data, output_path):
    """Save JSON to file."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"✓ Saved JSON to {output_path}")


if __name__ == "__main__":
    # Configuration
    MODEL_PATH = "models/xception_multioutput_best.pth"
    TEST_IMAGE = "D:/28455641/Segregated/Test/thyroid_dataset/Dataset/TR4/images/000001.jpg"
    TEST_XML = "D:/28455641/Segregated/Test/thyroid_dataset/Dataset/TR4/xml/000001.xml"
    OUTPUT_JSON = "outputs/multioutput_inference_output.json"
    DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    print("=" * 80)
    print("PyTorch Multi-Output Xception Inference")
    print("=" * 80)
    print(f"Model: {MODEL_PATH}")
    print(f"Test image: {TEST_IMAGE}")
    print(f"Device: {DEVICE}")
    print("=" * 80)
    
    # Load model
    print("\nLoading multi-output model...")
    model = load_multioutput_model(MODEL_PATH, DEVICE)
    print("✓ Model loaded")
    
    # Parse XML for bbox
    print("\nParsing XML annotation...")
    bbox = parse_xml(TEST_XML)
    print(f"✓ Bounding box: {bbox}")
    
    # Run inference
    print("\nRunning multi-output inference...")
    result = run_multioutput_inference(
        model=model,
        image_path=TEST_IMAGE,
        bbox=bbox,
        roi_id="nodule_test_001",
        device=DEVICE
    )
    
    # Print results
    print("\n" + "=" * 80)
    print("INFERENCE RESULT - FEATURE-FIRST APPROACH")
    print("=" * 80)
    print(f"ROI ID: {result['roi_id']}")
    print(f"\n🎯 PREDICTED FEATURES (5 outputs):")
    print("=" * 80)
    
    for feat_name, feat_data in result['predicted_features'].items():
        print(f"\n{feat_name.upper():20s}: {feat_data['value']}")
        print(f"  Confidence: {feat_data['confidence']:.2%}")
        print(f"  Points:     {result['tirads_points_breakdown'][feat_name]}")
    
    print("\n" + "=" * 80)
    print("📊 CALCULATED TIRADS CATEGORY")
    print("=" * 80)
    print(f"Total Points: {result['classification']['total_points']}")
    print(f"TIRADS Category: {result['classification']['predicted_tirads']}")
    print(f"Average Confidence: {result['classification']['confidence_score']:.2%}")
    
    print("\n" + "=" * 80)
    print("🏥 CLINICAL RECOMMENDATION")
    print("=" * 80)
    rec = result['clinical_recommendation']
    print(f"Category: {rec['tirads_category']}")
    print(f"Malignancy Risk: {rec['malignancy_risk']}")
    print(f"Suggested Action: {rec['suggested_action']}")
    print(f"Recommendation: {rec['recommendation_text']}")
    print(f"Nodule Size: {rec['nodule_size_mm']} mm")
    print(f"Meets FNA Criteria: {'YES ⚠️' if rec['meets_fna_criteria'] else 'NO'}")
    print(f"Meets Follow-up Criteria: {'YES' if rec['meets_followup_criteria'] else 'NO'}")
    
    print("\n" + "=" * 80)
    print("🔬 DETAILED TIRADS FEATURES")
    print("=" * 80)
    for feat_name, feat_detail in result['tirads_features'].items():
        print(f"\n{feat_name.upper()} ({feat_detail['points']} pts):")
        print(f"  Type: {feat_detail['type']}")
        print(f"  {feat_detail['description']}")
        print(f"  Confidence: {feat_detail['confidence']:.2%}")
    
    # Save JSON
    print("\n" + "=" * 80)
    save_json(result, OUTPUT_JSON)
    
    print("\n✅ Multi-output inference complete!")
    print("📁 Output Structure:")
    print("   • predicted_features: 5 individual feature predictions")
    print("   • feature_probabilities: Confidence for each feature")
    print("   • classification: TIRADS calculated from features")
    print("   • tirads_points_breakdown: ACR point system breakdown")
    print("   • clinical_recommendation: Clinical guidance based on size + TIRADS")
    print("=" * 80)
