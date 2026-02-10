"""
Multi-Output Xception Model for TI-RADS Feature Prediction
===========================================================

Predicts 5 individual sonographic features, then calculates TI-RADS score.
Includes regularization techniques to prevent overfitting.
"""

import torch
import torch.nn as nn
import timm

class XceptionMultiOutput(nn.Module):
    """
    Multi-output Xception model that predicts all 5 TI-RADS features.
    
    Features anti-overfitting measures:
    - Dropout layers
    - Batch normalization
    - Weight decay (applied via optimizer)
    - Pretrained backbone with fine-tuning
    """
    
    def __init__(self, pretrained=True, dropout_rate=0.3, freeze_backbone=False):
        """
        Args:
            pretrained: Use pretrained Xception weights
            dropout_rate: Dropout probability (default 0.3)
            freeze_backbone: If True, freeze backbone weights initially
        """
        super(XceptionMultiOutput, self).__init__()
        
        # Load pretrained Xception backbone
        self.backbone = timm.create_model('xception', pretrained=pretrained, num_classes=0)
        num_features = self.backbone.num_features  # 2048 for Xception
        
        # Freeze backbone if requested (can unfreeze later for fine-tuning)
        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False
        
        # Shared feature extraction with regularization
        self.shared_fc = nn.Sequential(
            nn.Dropout(dropout_rate),
            nn.Linear(num_features, 1024),
            nn.BatchNorm1d(1024),
            nn.ReLU(),
            nn.Dropout(dropout_rate / 2),  # Lighter dropout for second layer
            nn.Linear(1024, 512),
            nn.BatchNorm1d(512),
            nn.ReLU()
        )
        
        # Feature classification heads with dropout
        self.composition_head = nn.Sequential(
            nn.Dropout(dropout_rate / 2),
            nn.Linear(512, 5)
        )
        
        self.echogenicity_head = nn.Sequential(
            nn.Dropout(dropout_rate / 2),
            nn.Linear(512, 5)
        )
        
        self.shape_head = nn.Sequential(
            nn.Dropout(dropout_rate / 2),
            nn.Linear(512, 2)
        )
        
        self.margin_head = nn.Sequential(
            nn.Dropout(dropout_rate / 2),
            nn.Linear(512, 5)
        )
        
        self.echogenic_foci_head = nn.Sequential(
            nn.Dropout(dropout_rate / 2),
            nn.Linear(512, 5)
        )
        
    def forward(self, x):
        # Extract features from backbone
        features = self.backbone(x)
        
        # Shared feature processing
        shared = self.shared_fc(features)
        
        # Predict all 5 features
        return {
            'composition': self.composition_head(shared),
            'echogenicity': self.echogenicity_head(shared),
            'shape': self.shape_head(shared),
            'margin': self.margin_head(shared),
            'echogenic_foci': self.echogenic_foci_head(shared)
        }
    
    def unfreeze_backbone(self):
        """Unfreeze backbone for fine-tuning."""
        for param in self.backbone.parameters():
            param.requires_grad = True
        print("✅ Backbone unfrozen for fine-tuning")

# Feature definitions and ACR TI-RADS point system
FEATURE_DEFINITIONS = {
    'composition': {
        'classes': ['cystic', 'spongiform', 'mixed_cystic_solid', 'solid', 'partially_cystic'],
        'points': [0, 0, 1, 2, 1]
    },
    'echogenicity': {
        'classes': ['anechoic', 'hyperechoic', 'isoechoic', 'hypoechoic', 'very_hypoechoic'],
        'points': [0, 1, 1, 2, 3]
    },
    'shape': {
        'classes': ['wider_than_tall', 'taller_than_wide'],
        'points': [0, 3]
    },
    'margin': {
        'classes': ['smooth', 'ill_defined', 'lobulated', 'irregular', 'extrathyroidal_extension'],
        'points': [0, 0, 2, 2, 3]
    },
    'echogenic_foci': {
        'classes': ['none', 'macrocalcifications', 'peripheral', 'punctate_echogenic_foci', 'microcalcifications'],
        'points': [0, 1, 2, 3, 3]
    }
}

def calculate_tirads_from_features(predictions):
    """
    Calculate TI-RADS category from predicted features using ACR point system.
    
    Args:
        predictions: Dict with feature indices {feature_name: predicted_index}
    
    Returns:
        (tirads_category, total_points): 0-indexed TIRADS (0=TR1, 4=TR5) and total points
    """
    total_points = sum(
        FEATURE_DEFINITIONS[feat]['points'][pred_idx]
        for feat, pred_idx in predictions.items()
    )
    
    # ACR TI-RADS mapping (0-indexed)
    if total_points == 0:
        tirads = 0  # TR1
    elif total_points == 2:
        tirads = 1  # TR2
    elif total_points == 3:
        tirads = 2  # TR3
    elif 4 <= total_points <= 6:
        tirads = 3  # TR4
    else:  # 7+
        tirads = 4  # TR5
    
    return tirads + 1, total_points  # Return 1-indexed TIRADS (1-5)

def get_feature_labels_from_tirads(tirads_label):
    """
    Generate synthetic feature labels from TI-RADS.
    Used as fallback when real features are not available in XML.
    
    Args:
        tirads_label: 0-indexed TIRADS (0=TR1, 4=TR5)
    
    Returns:
        Dict with feature indices
    """
    tirads_to_features = {
        0: {'composition': 1, 'echogenicity': 0, 'shape': 0, 'margin': 0, 'echogenic_foci': 0},  # TR1
        1: {'composition': 4, 'echogenicity': 2, 'shape': 0, 'margin': 0, 'echogenic_foci': 0},  # TR2
        2: {'composition': 3, 'echogenicity': 2, 'shape': 0, 'margin': 0, 'echogenic_foci': 0},  # TR3
        3: {'composition': 3, 'echogenicity': 3, 'shape': 0, 'margin': 2, 'echogenic_foci': 0},  # TR4
        4: {'composition': 3, 'echogenicity': 4, 'shape': 1, 'margin': 3, 'echogenic_foci': 4}   # TR5
    }
    return tirads_to_features.get(tirads_label, tirads_to_features[2])
