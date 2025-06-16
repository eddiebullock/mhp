#!/usr/bin/env python3

import sys
import json
import numpy as np
import nibabel as nib
from nilearn import datasets, plotting, surface, image
from nilearn.image import new_img_like, math_img
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from matplotlib.colors import ListedColormap
import matplotlib.patches as mpatches

# Load the MNI152 template and anatomical image
mni_template = datasets.load_mni152_template()
anatomical_img = datasets.load_mni152_template(resolution=2)

# Define colors for each brain region (using more intuitive colors)
REGION_COLORS = {
    'prefrontal_cortex': '#FF6B6B',  # Warm red
    'temporal_lobe': '#4ECDC4',      # Cool blue-green
    'parietal_lobe': '#45B7D1',      # Sky blue
    'occipital_lobe': '#96CEB4',     # Soft green
    'amygdala': '#FFD93D',           # Bright yellow
    'hippocampus': '#FF8B94',        # Soft pink
    'cerebellum': '#6C5B7B',         # Purple
    'brainstem': '#C06C84',          # Rose
    'thalamus': '#F8B195',           # Peach
    'hypothalamus': '#355C7D',       # Navy blue
    'insula': '#FFA07A',             # Light salmon
    'motor_cortex': '#98FB98'        # Pale green
}

# Define region coordinates (simplified for better visualization)
REGION_COORDS = {
    'prefrontal_cortex': [
        (40, 30, 20), (-40, 30, 20),  # Front of brain
        (35, 35, 15), (-35, 35, 15),  # Additional points for better coverage
        (45, 25, 25), (-45, 25, 25)
    ],
    'temporal_lobe': [
        (-50, -20, -10), (50, -20, -10),  # Sides of brain
        (-45, -25, -5), (45, -25, -5),
        (-55, -15, -15), (55, -15, -15)
    ],
    'parietal_lobe': [
        (30, -50, 40), (-30, -50, 40),  # Top back of brain
        (35, -45, 35), (-35, -45, 35),
        (25, -55, 45), (-25, -55, 45)
    ],
    'occipital_lobe': [
        (0, -80, 20),  # Back of brain
        (10, -75, 25), (-10, -75, 25),
        (0, -85, 15)
    ],
    'amygdala': [
        (-20, -10, -20), (20, -10, -20),  # Deep in temporal lobes
        (-25, -5, -25), (25, -5, -25),
        (-15, -15, -15), (15, -15, -15)
    ],
    'hippocampus': [
        (-30, -20, -20), (30, -20, -20),  # Deep in temporal lobes
        (-35, -15, -25), (35, -15, -25),
        (-25, -25, -15), (25, -25, -15)
    ],
    'cerebellum': [
        (0, -50, -30),  # Back bottom of brain
        (15, -45, -35), (-15, -45, -35),
        (0, -55, -25)
    ],
    'brainstem': [
        (0, -30, -40),  # Bottom of brain
        (5, -25, -45), (-5, -25, -45),
        (0, -35, -35)
    ],
    'thalamus': [
        (0, -20, 0),  # Center of brain
        (5, -15, 5), (-5, -15, 5),
        (0, -25, -5)
    ],
    'hypothalamus': [
        (0, -10, -10),  # Below thalamus
        (5, -5, -15), (-5, -5, -15),
        (0, -15, -5)
    ],
    'insula': [
        (-35, 0, 0), (35, 0, 0),  # Deep in temporal lobes
        (-40, 5, 5), (40, 5, 5),
        (-30, -5, -5), (30, -5, -5)
    ],
    'motor_cortex': [
        (30, -20, 50), (-30, -20, 50),  # Top of brain
        (35, -15, 45), (-35, -15, 45),
        (25, -25, 55), (-25, -25, 55)
    ]
}

def create_activation_maps(experiences):
    """Create separate activation maps for each brain region."""
    # Initialize empty activation maps for each region
    activation_maps = {region: np.zeros(mni_template.shape) for region in REGION_COLORS.keys()}
    
    # Create activation spheres for each experience
    for exp in experiences:
        intensity = exp['intensity'] / 5.0  # Normalize intensity to 0-1 range
        for region in exp['brain_regions']:
            if region in REGION_COORDS:
                for x, y, z in REGION_COORDS[region]:
                    # Create a larger sphere of activation
                    xx, yy, zz = np.ogrid[:mni_template.shape[0], :mni_template.shape[1], :mni_template.shape[2]]
                    sphere = ((xx - x)**2 + (yy - y)**2 + (zz - z)**2) <= 200  # Increased radius
                    activation_maps[region][sphere] += intensity
    
    # Normalize each activation map
    for region in activation_maps:
        if np.max(activation_maps[region]) > 0:
            activation_maps[region] = activation_maps[region] / np.max(activation_maps[region])
    
    return activation_maps

def generate_visualization(experiences):
    """Generate user-friendly brain visualization with colored regions."""
    # Create activation maps for each region
    activation_maps = create_activation_maps(experiences)
    
    # Create figure with subplots
    fig = plt.figure(figsize=(20, 8))
    
    # Create a combined activation map for visualization
    combined_map = np.zeros(mni_template.shape)
    for region, activation_map in activation_maps.items():
        if np.max(activation_map) > 0:
            # Add region's activation to combined map with its color
            color_value = int(REGION_COLORS[region].replace('#', ''), 16)
            combined_map += activation_map * color_value
    
    # Create NIfTI image for the combined map
    activation_img = new_img_like(mni_template, combined_map)
    
    # Plot three views with anatomical background
    plt.subplot(131)
    plotting.plot_stat_map(
        activation_img,
        bg_img=anatomical_img,
        display_mode='l',  # Left side view
        cut_coords=[-40],  # Show left side
        title='Left Side View',
        threshold=0.1,
        alpha=0.7,
        draw_cross=False,
        annotate=False,
        colorbar=False
    )
    
    plt.subplot(132)
    plotting.plot_stat_map(
        activation_img,
        bg_img=anatomical_img,
        display_mode='r',  # Right side view
        cut_coords=[40],   # Show right side
        title='Right Side View',
        threshold=0.1,
        alpha=0.7,
        draw_cross=False,
        annotate=False,
        colorbar=False
    )
    
    plt.subplot(133)
    plotting.plot_stat_map(
        activation_img,
        bg_img=anatomical_img,
        display_mode='z',  # Top view
        cut_coords=[20],   # Show top
        title='Top View',
        threshold=0.1,
        alpha=0.7,
        draw_cross=False,
        annotate=False,
        colorbar=False
    )
    
    # Add legend with user-friendly region names
    region_names = {
        'prefrontal_cortex': 'Front of Brain (Planning & Emotions)',
        'temporal_lobe': 'Side of Brain (Social & Memory)',
        'parietal_lobe': 'Top Back (Sensory & Focus)',
        'occipital_lobe': 'Back of Brain (Vision)',
        'amygdala': 'Emotion Center',
        'hippocampus': 'Memory Center',
        'cerebellum': 'Balance & Coordination',
        'brainstem': 'Basic Functions',
        'thalamus': 'Sensory Relay',
        'hypothalamus': 'Hunger & Basic Needs',
        'insula': 'Taste & Internal Awareness',
        'motor_cortex': 'Movement Control'
    }
    
    legend_elements = [
        mpatches.Patch(facecolor=color, edgecolor='black', alpha=0.7, 
                      label=f"{region_names[region]} ({int(np.max(activation_maps[region]) * 5)}/5)")
        for region, color in REGION_COLORS.items()
        if np.max(activation_maps[region]) > 0
    ]
    plt.figlegend(handles=legend_elements, loc='center right', 
                 bbox_to_anchor=(0.98, 0.5), fontsize=10)
    
    plt.suptitle('Your Brain Activity', fontsize=16, y=0.95)
    plt.tight_layout()
    
    # Convert plot to base64
    buf = BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', dpi=300)
    plt.close()
    buf.seek(0)
    img_str = base64.b64encode(buf.read()).decode('utf-8')
    
    # Get list of activated regions with their intensities
    activated_regions = [
        {
            'region': region,
            'intensity': int(np.max(activation_maps[region]) * 5),
            'description': region_names[region]
        }
        for region in activation_maps
        if np.max(activation_maps[region]) > 0
    ]
    
    return {
        'visualization': f'data:image/png;base64,{img_str}',
        'regions': activated_regions,
        'max_intensity': max(float(np.max(activation_maps[region])) 
                           for region in activated_regions)
    }

if __name__ == '__main__':
    # Read input from stdin
    input_data = json.loads(sys.argv[1])
    
    # Generate visualization
    result = generate_visualization(input_data['experiences'])
    
    # Output JSON to stdout
    print(json.dumps(result)) 