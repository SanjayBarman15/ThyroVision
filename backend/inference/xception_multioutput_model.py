# xception_multioutput_model.py

"""
Multi-Output Xception Model for TI-RADS Feature Prediction
===========================================================

Predicts 5 individual sonographic features, then calculates TI-RADS score.

Feature Outputs:
1. Composition (5 classes)
2. Echogenicity (5 classes)
3. Shape (2 classes)
4. Margin (5 classes)
5. Echogenic Foci (5 classes)

Then calculates TI-RADS (1-5) from feature points.
"""

import torch
import torch.nn as nn
import timm


class XceptionMultiOutput(nn.Module):
    """
    Multi-output Xception model that predicts all 5 TI-RADS features.
    """
    
    def __init__(self, pretrained=True):
        super(XceptionMultiOutput, self).__init__()
        
        # Load pretrained Xception backbone
        self.backbone = timm.create_model('xception', pretrained=pretrained, num_classes=0)
        
        # Get the number of features from backbone
        num_features = self.backbone.num_features  # 2048 for Xception
        
        # Feature classification heads
        self.composition_head = nn.Linear(num_features, 5)  # cystic, spongiform, mixed, solid, partially_cystic
        self.echogenicity_head = nn.Linear(num_features, 5)  # anechoic, hyperechoic, isoechoic, hypoechoic, very_hypoechoic
        self.shape_head = nn.Linear(num_features, 2)  # wider-than-tall, taller-than-wide
        self.margin_head = nn.Linear(num_features, 5)  # smooth, ill-defined, lobulated, irregular, extrathyroidal
        self.echogenic_foci_head = nn.Linear(num_features, 5)  # none, macro, peripheral, punctate, micro
        
    def forward(self, x):
        """
        Forward pass.
        
        Returns:
            Dict with 5 feature predictions (logits)
        """
        # Extract features from backbone
        features = self.backbone(x)
        
        # Predict each feature
        composition = self.composition_head(features)
        echogenicity = self.echogenicity_head(features)
        shape = self.shape_head(features)
        margin = self.margin_head(features)
        echogenic_foci = self.echogenic_foci_head(features)
        
        return {
            'composition': composition,
            'echogenicity': echogenicity,
            'shape': shape,
            'margin': margin,
            'echogenic_foci': echogenic_foci
        }


# Feature definitions and point mappings
FEATURE_DEFINITIONS = {
    'composition': {
        'classes': ['cystic', 'spongiform', 'mixed_cystic_solid', 'solid', 'partially_cystic'],
        'points': [0, 0, 1, 2, 1],
        'descriptions': [
            'Cystic or almost completely cystic',
            'Spongiform (>50% cystic)',
            'Mixed cystic and solid',
            'Solid or almost completely solid',
            'Partially cystic with solid components'
        ]
    },
    'echogenicity': {
        'classes': ['anechoic', 'hyperechoic', 'isoechoic', 'hypoechoic', 'very_hypoechoic'],
        'points': [0, 1, 1, 2, 3],
        'descriptions': [
            'Anechoic (cystic, no echoes)',
            'Hyperechoic or isoechoic (brighter than or same as thyroid)',
            'Isoechoic (same as thyroid)',
            'Hypoechoic (darker than thyroid)',
            'Very hypoechoic (darker than strap muscles)'
        ]
    },
    'shape': {
        'classes': ['wider_than_tall', 'taller_than_wide'],
        'points': [0, 3],
        'descriptions': [
            'Wider than tall (horizontal orientation)',
            'Taller than wide (vertical orientation, suspicious)'
        ]
    },
    'margin': {
        'classes': ['smooth', 'ill_defined', 'lobulated', 'irregular', 'extrathyroidal_extension'],
        'points': [0, 0, 2, 2, 3],
        'descriptions': [
            'Smooth margins',
            'Ill-defined margins',
            'Lobulated or irregular margins',
            'Irregular margins',
            'Extra-thyroidal extension (very suspicious)'
        ]
    },
    'echogenic_foci': {
        'classes': ['none', 'macrocalcifications', 'peripheral', 'punctate_echogenic_foci', 'microcalcifications'],
        'points': [0, 1, 2, 3, 3],
        'descriptions': [
            'None or large comet-tail artifacts',
            'Macrocalcifications',
            'Peripheral (rim) calcifications',
            'Punctate echogenic foci',
            'Microcalcifications (highly suspicious)'
        ]
    }
}


def calculate_tirads_from_features(predictions):
    """
    Calculate TI-RADS category from predicted features.
    
    Args:
        predictions: Dict with predicted feature indices
        
    Returns:
        tirads_category (1-5), total_points, breakdown dict
    """
    total_points = 0
    breakdown = {}
    
    for feature_name, predicted_idx in predictions.items():
        points = FEATURE_DEFINITIONS[feature_name]['points'][predicted_idx]
        class_name = FEATURE_DEFINITIONS[feature_name]['classes'][predicted_idx]
        description = FEATURE_DEFINITIONS[feature_name]['descriptions'][predicted_idx]
        
        total_points += points
        breakdown[feature_name] = {
            'predicted_class': class_name,
            'points': points,
            'description': description
        }
    
    # Map total points to TI-RADS category
    # ACR TI-RADS: 0 pts = TR1, 2 pts = TR2, 3 pts = TR3, 4-6 pts = TR4, ≥7 pts = TR5
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
    
    return tirads, total_points, breakdown


def get_feature_labels_from_tirads(tirads_label):
    """
    Generate synthetic feature labels from TI-RADS label.
    This is a temporary solution until we have ground truth feature labels.
    
    Args:
        tirads_label: TI-RADS category (0-4 in dataset, representing TR1-TR5)
        
    Returns:
        Dict with feature labels (indices)
    """
    # Mapping based on typical feature patterns for each TI-RADS category
    tirads_to_features = {
        0: {  # TR1 - Benign (0 points)
            'composition': 1,  # spongiform (0 pts)
            'echogenicity': 1,  # hyperechoic (1 pt) -> adjusted to get 0 total
            'shape': 0,  # wider-than-tall (0 pts)
            'margin': 0,  # smooth (0 pts)
            'echogenic_foci': 0  # none (0 pts)
        },
        1: {  # TR2 - Not suspicious (2 points)
            'composition': 4,  # partially_cystic (1 pt)
            'echogenicity': 2,  # isoechoic (1 pt)
            'shape': 0,  # wider-than-tall (0 pts)
            'margin': 0,  # smooth (0 pts)
            'echogenic_foci': 0  # none (0 pts)
        },
        2: {  # TR3 - Mildly suspicious (3 points)
            'composition': 3,  # solid (2 pts)
            'echogenicity': 2,  # isoechoic (1 pt)
            'shape': 0,  # wider-than-tall (0 pts)
            'margin': 0,  # smooth (0 pts)
            'echogenic_foci': 0  # none (0 pts)
        },
        3: {  # TR4 - Moderately suspicious (4-6 points)
            'composition': 3,  # solid (2 pts)
            'echogenicity': 3,  # hypoechoic (2 pts)
            'shape': 0,  # wider-than-tall (0 pts)
            'margin': 2,  # lobulated (2 pts)
            'echogenic_foci': 0  # none (0 pts)
        },
        4: {  # TR5 - Highly suspicious (7+ points)
            'composition': 3,  # solid (2 pts)
            'echogenicity': 4,  # very_hypoechoic (3 pts)
            'shape': 1,  # taller-than-wide (3 pts)
            'margin': 3,  # irregular (2 pts)
            'echogenic_foci': 4  # microcalcifications (3 pts)
        }
    }
    
    return tirads_to_features.get(tirads_label, tirads_to_features[2])


if __name__ == "__main__":
    # Test the model
    model = XceptionMultiOutput(pretrained=False)
    
    # Test forward pass
    x = torch.randn(2, 3, 299, 299)
    outputs = model(x)
    
    print("Model outputs:")
    for feature_name, logits in outputs.items():
        print(f"  {feature_name}: {logits.shape}")
    
    # Test TI-RADS calculation
    test_predictions = {
        'composition': 3,  # solid (2 pts)
        'echogenicity': 4,  # very_hypoechoic (3 pts)
        'shape': 1,  # taller-than-wide (3 pts)
        'margin': 3,  # irregular (2 pts)
        'echogenic_foci': 4  # microcalcifications (3 pts)
    }
    
    tirads, points, breakdown = calculate_tirads_from_features(test_predictions)
    print(f"\n✅ Test TI-RADS Calculation:")
    print(f"   Total Points: {points}")
    print(f"   TI-RADS Category: TR{tirads}")
    print(f"   Breakdown: {breakdown}")
