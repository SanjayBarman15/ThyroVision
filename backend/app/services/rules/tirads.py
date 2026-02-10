# TI-RADS Rule Engine (ACR Point System)
from typing import Dict
from app.models.xception_model import FEATURE_DEFINITIONS

def calculate_tirads(feature_results: dict) -> Dict:
    """
    Calculates the TI-RADS category using the official ACR point system.
    
    Args:
        feature_results: Dict containing predicted feature metadata (indices)
    """
    total_points = 0
    breakdown = {}
    
    # Names in feature_results match FEATURE_DEFINITIONS keys
    # Note: 'calcifications' in mock is 'echogenic_foci' in real model
    # Note: 'margins' in mock is 'margin' in real model
    
    for feature_name in ['composition', 'echogenicity', 'shape', 'margin', 'echogenic_foci']:
        data = feature_results.get(feature_name)
        if not data:
            continue
            
        idx = data['index']
        points = FEATURE_DEFINITIONS[feature_name]['points'][idx]
        
        total_points += points
        breakdown[feature_name] = {
            "value": data['value'],
            "points": points,
            "description": FEATURE_DEFINITIONS[feature_name]['descriptions'][idx]
        }

    # ACR TI-RADS Mapping:
    # 0 pts = TR1
    # 2 pts = TR2
    # 3 pts = TR3
    # 4-6 pts = TR4
    # 7+ pts = TR5
    if total_points == 0:
        tirads = 1
    elif total_points == 2:
        tirads = 2
    elif total_points == 3:
        tirads = 3
    elif 4 <= total_points <= 6:
        tirads = 4
    else:  # 7+
        tirads = 5

    # Confidence calculation: Use the average confidence of all 5 features
    confidence = sum(f['confidence'] for f in feature_results.values() if isinstance(f, dict) and 'confidence' in f) / 5.0

    return {
        "tirads": tirads,
        "total_points": total_points,
        "confidence": round(confidence, 4),
        "breakdown": breakdown,
        "rule_engine": {
            "name": "acr-tirads-official",
            "version": "2024.1",
            "point_system": "ACR 2017"
        }
    }
