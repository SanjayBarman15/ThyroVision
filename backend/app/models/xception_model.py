# xception_model.py

import torch
import torch.nn as nn
import timm

class XceptionMultiOutput(nn.Module):
    """
    Multi-output Xception model that predicts all 5 TI-RADS features.
    """
    
    def __init__(self, pretrained=False):
        super(XceptionMultiOutput, self).__init__()
        
        # Load Xception backbone
        # We use timm to create the model without the final classification layer
        self.backbone = timm.create_model('xception', pretrained=pretrained, num_classes=0)
        
        # Get the number of features from backbone
        num_features = self.backbone.num_features  # 2048 for Xception
        
        # Heads for each ACR feature
        self.composition_head = nn.Linear(2048, 3)
        self.echogenicity_head = nn.Linear(2048, 4)
        self.shape_head = nn.Linear(2048, 2)
        self.margin_head = nn.Linear(2048, 5)
        self.echogenic_foci_head = nn.Linear(2048, 4)
        
        # TI-RADS Head (Maps to the 'fc' layer in the checkpoint)
        self.tirads_head = nn.Linear(2048, 5)

    def forward(self, x):
        """
        Forward pass.
        
        Returns:
            Dict with 5 feature predictions AND 1 tirads prediction
        """
        # Extract features from backbone
        features = self.backbone(x)
        
        # Predict each feature
        return {
            'composition': self.composition_head(features),
            'echogenicity': self.echogenicity_head(features),
            'shape': self.shape_head(features),
            'margin': self.margin_head(features),
            'echogenic_foci': self.echogenic_foci_head(features),
            'tirads': self.tirads_head(features)
        }

# Feature definitions and point mappings (Synchronized with ML team)
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
