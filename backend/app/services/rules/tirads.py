# PURE rule engine
from typing import Dict

def calculate_tirads(features: dict) -> Dict:
    score = 1

    if features["composition"] == "Solid":
        score += 1
    if features["echogenicity"] == "Hypoechoic":
        score += 1
    if features["margins"] == "Irregular":
        score += 1
    if features["calcifications"] == "Microcalcifications":
        score += 1
    if features["shape"] == "Taller-than-wide":
        score += 1

    tirads_score = min(score, 5)

    return {
        "tirads": tirads_score,
        "confidence": 0.92,  # Mock confidence for rule engine
        "rule_engine": {
            "name": "acr-tirads",
            "version": "2024.1"
        }
    }
