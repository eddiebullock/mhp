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
from matplotlib.colors import ListedColormap, LinearSegmentedColormap
import matplotlib.patches as mpatches
import seaborn as sns
import logging

# Set the style to a more paper-like appearance
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr  # Log to stderr to avoid interfering with JSON output
)
logger = logging.getLogger(__name__)

# Constants for visualization
SPHERE_RADIUS = 15  # Increased from 10 to make activation regions larger
VIEWS = ['x', 'y', 'z']  # Changed from ['axial', 'sagittal', 'coronal'] to valid modes
FIGURE_SIZE = (40, 20)  # Increased from (30, 15) for larger display
DPI = 300  # Keep at 300 for reasonable file size while maintaining quality

# Load the MNI152 template and anatomical image
mni_template = datasets.load_mni152_template()
anatomical_img = datasets.load_mni152_template(resolution=2)

# Define vibrant colors for each brain region with increased opacity
REGION_COLORS = {
    'prefrontal_cortex': '#FF3333',  # Brighter red
    'temporal_lobe': '#33B5FF',      # Brighter blue
    'parietal_lobe': '#33CC33',      # Brighter green
    'occipital_lobe': '#FFCC00',     # Brighter yellow
    'amygdala': '#FF0066',           # Brighter pink
    'hippocampus': '#9933FF',        # Brighter purple
    'cerebellum': '#00CC99',         # Brighter teal
    'brainstem': '#FF5500',          # Brighter orange
    'thalamus': '#00CCFF',           # Brighter light blue
    'hypothalamus': '#CC33FF',       # Brighter purple
    'insula': '#FFCC00',             # Brighter amber
    'motor_cortex': '#33CC33',       # Brighter green
    'basal_ganglia': '#FF3333'       # Brighter coral red
}

# Define descriptions for each brain region
BRAIN_REGION_DESCRIPTIONS = {
    'prefrontal_cortex': 'Executive functions, decision making, and personality',
    'temporal_lobe': 'Auditory processing, memory, and language comprehension',
    'parietal_lobe': 'Sensory integration, spatial awareness, and attention',
    'occipital_lobe': 'Visual processing and perception',
    'amygdala': 'Emotional processing, fear, and memory formation',
    'hippocampus': 'Memory formation, learning, and spatial navigation',
    'cerebellum': 'Motor coordination, balance, and movement control',
    'brainstem': 'Basic life functions, breathing, and heart rate',
    'thalamus': 'Sensory relay station and consciousness regulation',
    'hypothalamus': 'Hormone regulation, body temperature, and basic drives',
    'insula': 'Interoception, emotional awareness, and empathy',
    'motor_cortex': 'Voluntary movement control and planning',
    'basal_ganglia': 'Movement control, habit formation, and reward processing'
}

# Create custom colormaps for each region
REGION_CMAPS = {
    region: LinearSegmentedColormap.from_list(
        f'{region}_cmap',
        ['#FFFFFF', color],
        N=256
    )
    for region, color in REGION_COLORS.items()
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
    ],
    'basal_ganglia': [
        (-20, -10, -20), (20, -10, -20),  # Deep in temporal lobes
        (-25, -5, -25), (25, -5, -25),
        (-15, -15, -15), (15, -15, -15)
    ]
}

def create_activation_maps(experiences):
    """Create separate activation maps for each brain region with enhanced visibility."""
    # Initialize empty activation maps for each region
    activation_maps = {region: np.zeros(mni_template.shape) for region in REGION_COLORS.keys()}
    
    # Create activation spheres for each experience with enhanced intensity
    for exp in experiences:
        intensity = (exp['intensity'] / 5.0) * 2.0  # Increased from 1.5 to 2.0 for stronger visibility
        for region in exp['brain_regions']:
            if region in REGION_COORDS:
                for x, y, z in REGION_COORDS[region]:
                    # Create a larger sphere of activation with smoother edges
                    xx, yy, zz = np.ogrid[:mni_template.shape[0], :mni_template.shape[1], :mni_template.shape[2]]
                    distance = np.sqrt((xx - x)**2 + (yy - y)**2 + (zz - z)**2)
                    sphere = np.exp(-distance**2 / (2 * 100))  # Reduced from 150 to 100 for sharper edges
                    activation_maps[region] += sphere * intensity
    
    # Normalize each activation map with enhanced contrast
    for region in activation_maps:
        if np.max(activation_maps[region]) > 0:
            # Apply stronger sigmoid-like normalization for better contrast
            activation_maps[region] = 1 / (1 + np.exp(-4 * (activation_maps[region] / np.max(activation_maps[region]) - 0.4)))
    
    return activation_maps

def generate_visualization(experiences):
    """Generate user-friendly brain visualization with enhanced colored regions."""
    try:
        logger.info("Starting visualization generation")
        logger.info(f"Processing {len(experiences)} experiences")

        # Extract active regions from experiences and filter out unknown regions
        active_regions = set()
        for experience in experiences:
            # Only add regions that exist in our coordinate system
            active_regions.update(region for region in experience['brain_regions'] 
                                if region in REGION_COORDS)
        
        logger.info(f"Found {len(active_regions)} active regions: {active_regions}")

        if not active_regions:
            raise ValueError("No valid brain regions found in the experiences")

        # Load anatomical template
        logger.info("Loading anatomical template")
        anatomical_img = datasets.load_mni152_template()
        mni_template = anatomical_img.get_fdata()
        logger.info(f"Template shape: {mni_template.shape}")

        # Create activation maps for each region
        logger.info("Creating activation maps")
        activation_maps = {}
        for region in active_regions:
            logger.info(f"Processing region: {region}")
            # Create a sphere of activation at the region's coordinates
            activation = np.zeros(mni_template.shape)
            for coord in REGION_COORDS[region]:
                # Create a sphere of activation
                x, y, z = coord
                x_idx, y_idx, z_idx = np.ogrid[:mni_template.shape[0], :mni_template.shape[1], :mni_template.shape[2]]
                dist = np.sqrt((x_idx - x)**2 + (y_idx - y)**2 + (z_idx - z)**2)
                sphere = np.exp(-dist**2 / (2 * (SPHERE_RADIUS/2)**2))  # Gaussian falloff
                activation = np.maximum(activation, sphere)
            
            # Normalize activation
            if np.max(activation) > 0:
                activation = activation / np.max(activation)
            
            # Store the activation map
            activation_maps[region] = activation
            logger.info(f"Created activation map for {region} with max value: {np.max(activation)}")

        # Create a combined RGB activation map for visualization
        logger.info("Creating combined RGB visualization")
        combined_rgb = np.zeros((*mni_template.shape, 3), dtype=np.float32)
        alpha_map = np.zeros(mni_template.shape, dtype=np.float32)
        
        # Overlay each region's color using alpha blending
        for region, activation_map in activation_maps.items():
            if np.max(activation_map) > 0:
                color_hex = REGION_COLORS[region].lstrip('#')
                color_rgb = tuple(int(color_hex[i:i+2], 16)/255.0 for i in (0, 2, 4))
                # Blend color into the combined_rgb map
                for c in range(3):
                    combined_rgb[..., c] += activation_map * color_rgb[c]
                alpha_map += activation_map

        # Normalize so that overlapping regions don't oversaturate
        alpha_map = np.clip(alpha_map, 0, 1)
        for c in range(3):
            combined_rgb[..., c] = np.clip(combined_rgb[..., c], 0, 1)

        # Create a grayscale anatomical background
        logger.info("Creating anatomical background")
        anat_data = anatomical_img.get_fdata()
        anat_norm = (anat_data - anat_data.min()) / (np.ptp(anat_data) + 1e-8)

        # Blend anatomical background and colored activations
        final_rgb = np.zeros_like(combined_rgb)
        for c in range(3):
            final_rgb[..., c] = (1 - alpha_map) * anat_norm + alpha_map * combined_rgb[..., c]

        # Create a single 3D image for visualization
        logger.info("Creating final visualization image")
        visualization_img = np.max(final_rgb, axis=-1)
        visualization_nii = new_img_like(anatomical_img, visualization_img)

        # Create figure with subplots
        logger.info("Creating figure with subplots")
        fig = plt.figure(figsize=FIGURE_SIZE, facecolor='white', dpi=DPI)
        fig.suptitle('Brain Activity Visualization', fontsize=36, y=0.95, fontweight='bold')

        # Plot each view
        for i, view in enumerate(VIEWS):
            logger.info(f"Plotting {view} view")
            ax = fig.add_subplot(1, 3, i+1)
            try:
                plotting.plot_img(
                    visualization_nii,
                    axes=ax,
                    display_mode=view,
                    cut_coords=None,
                    colorbar=False,
                    annotate=False,
                    draw_cross=False,
                    black_bg=False,
                    cmap='hot',
                    alpha=0.8  # Added alpha for better visibility
                )
                ax.set_title(f'{view.title()} View', fontsize=28, pad=20)
            except Exception as e:
                logger.error(f"Error plotting {view} view: {str(e)}")
                raise

        # Add legend only for active regions
        logger.info("Adding legend")
        legend_elements = []
        for region in active_regions:
            if region in REGION_COLORS:
                color = REGION_COLORS[region]
                label = f"{region.replace('_', ' ').title()}"
                legend_elements.append(plt.Rectangle((0, 0), 1, 1, fc=color, label=label))

        # Add legend with a white background
        legend = fig.legend(
            handles=legend_elements,
            loc='center',
            bbox_to_anchor=(0.5, 0.02),
            ncol=2,
            frameon=True,
            framealpha=1,
            facecolor='white',
            edgecolor='gray',
            fontsize=16
        )

        # Add a note about the visualization
        plt.figtext(
            0.5, 0.01,
            'Note: Colors indicate brain regions activated during your experiences. Intensity of color represents relative activation strength.',
            ha='center',
            fontsize=16,
            style='italic'
        )

        # Adjust layout and save
        logger.info("Saving visualization")
        plt.tight_layout(rect=[0, 0.1, 1, 0.9])
        
        # Save to buffer with optimized settings
        buf = BytesIO()
        plt.savefig(
            buf,
            format='png',
            dpi=DPI,
            bbox_inches='tight',
            pad_inches=0.1,
            facecolor='white',
            edgecolor='none',
            transparent=False
        )
        plt.close(fig)
        
        # Convert to base64
        buf.seek(0)
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        
        # Create regions list with intensity and descriptions
        regions = []
        for region in active_regions:
            # Find the experience that activated this region
            region_experience = next(
                (exp for exp in experiences if region in exp['brain_regions']),
                None
            )
            intensity = region_experience['intensity'] if region_experience else 0.5
            
            # Get region description
            description = BRAIN_REGION_DESCRIPTIONS.get(region, region.replace('_', ' ').title())
            
            regions.append({
                'region': region,
                'intensity': intensity,
                'description': description
            })

        # Return the visualization data in the expected format
        return {
            'visualization': f'data:image/png;base64,{img_base64}',
            'regions': regions,
            'max_intensity': max(exp['intensity'] for exp in experiences)
        }
    except Exception as e:
        logger.error(f"Error in generate_visualization: {str(e)}", exc_info=True)
        raise

if __name__ == '__main__':
    try:
        # Read input data from command line argument
        input_data = json.loads(sys.argv[1])
        logger.info("Received input data")
        
        # Generate visualization
        result = generate_visualization(input_data['experiences'])
        
        # Output clean JSON to stdout
        print(json.dumps(result))
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error in main: {str(e)}", exc_info=True)
        sys.exit(1) 