// src/app/brain-journal/components/BrainMeshViewer.tsx

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMediaQuery } from 'react-responsive';

// Experience type to color mapping
const EXPERIENCE_COLORS: Record<string, string> = {
    anxiety: '#ff6b6b',      // Red for anxiety
    stress: '#ff9f43',       // Orange for stress
    happiness: '#20bf6b',    // Green for happiness
    exercise: '#45aaf2',     // Blue for exercise
    social_interaction: '#8854d0', // Purple for social interaction
    learning: '#4b6584',     // Dark blue for learning
    creativity: '#f7b731',   // Yellow for creativity
    meditation: '#2ecc71'    // Light green for meditation
};

// Brain region descriptions
const BRAIN_REGION_DESCRIPTIONS: Record<string, string> = {
    prefrontal_cortex: "Responsible for decision-making, planning, and emotional regulation",
    amygdala: "Involved in processing emotions, particularly fear and anxiety",
    temporal_lobe: "Processes auditory information and language",
    parietal_lobe: "Processes sensory information and spatial awareness",
    occipital_lobe: "Processes visual information",
    cerebellum: "Essential for balance, coordination, and motor learning",
    brain_stem: "Controls basic bodily functions and connects brain to spinal cord",
    hypothalamus: "Controls basic bodily functions and hormone regulation",
    nucleus_accumbens: "Plays a key role in reward and pleasure processing",
    ventral_tegmental_area: "Important for motivation and reward processing",
    basal_ganglia: "Involved in movement control and habit formation",
    insula: "Involved in emotional awareness and interoception",
    anterior_cingulate_cortex: "Plays a role in emotional regulation and decision-making"
};

// Mapping of brain regions to mesh names in the model
const BRAIN_REGION_TO_MESH: Record<string, string[]> = {
    // Frontal lobe (prefrontal cortex)
    prefrontal_cortex: ['Brain_Part_01_BRAIN_TEXTURE_blinn2_0'],
    
    // Temporal lobe (including amygdala)
    amygdala: ['Brain_Part_02_BRAIN_TEXTURE_blinn2_0'],
    temporal_lobe: ['Brain_Part_02_BRAIN_TEXTURE_blinn2_0'],
    
    // Parietal lobe
    parietal_lobe: ['Brain_Part_03_BRAIN_TEXTURE_blinn2_0'],
    
    // Occipital lobe
    occipital_lobe: ['Brain_Part_04_BRAIN_TEXTURE_blinn2_0'],
    
    // Cerebellum
    cerebellum: ['Brain_Part_05_BRAIN_TEXTURE_blinn2_0'],
    
    // Brain stem and other regions
    brain_stem: ['Brain_Part_06_BRAIN_TEXTURE_blinn2_0'],
    hypothalamus: ['Brain_Part_06_BRAIN_TEXTURE_blinn2_0'],
    nucleus_accumbens: ['Brain_Part_06_BRAIN_TEXTURE_blinn2_0'],
    ventral_tegmental_area: ['Brain_Part_06_BRAIN_TEXTURE_blinn2_0'],
    basal_ganglia: ['Brain_Part_06_BRAIN_TEXTURE_blinn2_0'],
    insula: ['Brain_Part_06_BRAIN_TEXTURE_blinn2_0'],
    anterior_cingulate_cortex: ['Brain_Part_06_BRAIN_TEXTURE_blinn2_0']
};

// Valid experience types for type safety
type ExperienceType = keyof typeof EXPERIENCE_COLORS;

// API Experience format
interface APIExperience {
    analysis_id: string;
    experience_type: string;
    intensity: number;
    evidence_quote: string;
    brain_regions: string[];
}

// Internal Experience format
interface Experience {
    type: ExperienceType;
    intensity: number;
    evidence: string;
    brain_regions: string[];
}

interface BrainMeshViewerProps {
    experiences?: APIExperience[];
}

interface TooltipData {
    region: string;
    experience: Experience;
    position: { x: number; y: number };
}

// Helper function to safely format text
const formatText = (text: string | undefined): string => {
    if (!text) return '';
    return text.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Heat map colors from cool (blue) to hot (red)
const ACTIVATION_COLORS = {
    low: new THREE.Color(0x0000ff),    // Blue for low activation
    medium: new THREE.Color(0x00ff00),  // Green for medium activation
    high: new THREE.Color(0xff0000)     // Red for high activation
};

// Helper function to create a colored material with intensity
const createExperienceMaterial = (color: string, intensity: number) => {
    const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: intensity * 0.5, // Scale down emissive intensity
        transparent: true,
        opacity: 0.8 + (intensity * 0.2), // Base opacity 0.8, up to 1.0
        shininess: 30,
        specular: new THREE.Color(0xffffff),
        flatShading: false
    });
    return material;
};

function BrainMesh({ experiences = [] }: BrainMeshViewerProps) {
    const { scene } = useGLTF('/models/brain_areas.glb');
    const meshRef = useRef<THREE.Group>(null);
    const [hoveredMesh, setHoveredMesh] = useState<THREE.Mesh | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const { camera } = useThree();
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Log when experiences prop changes
    useEffect(() => {
        console.log("BrainMesh received experiences:", experiences);
    }, [experiences]);

    // Convert API experiences to internal format
    const convertExperiences = useCallback((apiExperiences: APIExperience[]): Experience[] => {
        return apiExperiences
            .filter(exp => EXPERIENCE_COLORS[exp.experience_type] !== undefined)
            .map(exp => ({
                type: exp.experience_type as ExperienceType,
                intensity: exp.intensity,
                evidence: exp.evidence_quote,
                brain_regions: exp.brain_regions
            }));
    }, []);

    // Calculate activation level for a region based on experiences
    const calculateRegionActivation = useCallback((region: string, experiences: Experience[]): number => {
        return experiences.reduce((maxActivation, exp) => {
            if (exp.brain_regions.includes(region)) {
                return Math.max(maxActivation, exp.intensity);
            }
            return maxActivation;
        }, 0);
    }, []);

    // Get color based on activation level
    const getActivationColor = useCallback((activation: number): THREE.Color => {
        if (activation < 0.3) {
            return ACTIVATION_COLORS.low;
        } else if (activation < 0.7) {
            return ACTIVATION_COLORS.medium;
        } else {
            return ACTIVATION_COLORS.high;
        }
    }, []);

    // Create a map of mesh names to their experiences
    const meshToExperience = useCallback(() => {
        const map = new Map<string, Experience>();
        const convertedExperiences = convertExperiences(experiences);
        console.log("Creating mesh to experience map with converted experiences:", convertedExperiences);
        
        convertedExperiences.forEach(exp => {
            if (!exp.type || !exp.brain_regions) {
                console.log("Skipping invalid experience:", exp);
                return;
            }
            console.log("Processing experience:", exp.type, "with regions:", exp.brain_regions);
            
            exp.brain_regions.forEach(region => {
                const meshNames = BRAIN_REGION_TO_MESH[region] || [];
                console.log("Region", region, "maps to meshes:", meshNames);
                
                meshNames.forEach(meshName => {
                    map.set(meshName, exp);
                });
            });
        });
        
        console.log("Final mesh to experience map:", 
            Array.from(map.entries()).map(([mesh, exp]) => `${mesh} -> ${exp.type}`)
        );
        return map;
    }, [experiences, convertExperiences]);

    // Handle mouse/touch movement
    const handlePointerMove = useCallback((event: MouseEvent | TouchEvent) => {
        if (!meshRef.current) return;

        const rect = (event.target as HTMLElement).getBoundingClientRect();
        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(meshRef.current.children, true);

        if (intersects.length > 0) {
            const mesh = intersects[0].object as THREE.Mesh;
            const experience = meshToExperience().get(mesh.name);
            
            if (experience?.type) { // Only set tooltip if we have a valid experience
                const region = Object.entries(BRAIN_REGION_TO_MESH)
                    .find(([_, meshes]) => meshes.includes(mesh.name))?.[0];
                
                if (region) {
                    setHoveredMesh(mesh);
                    setTooltip({
                        region,
                        experience,
                        position: { x: clientX, y: clientY }
                    });
                }
            }
        } else {
            setHoveredMesh(null);
            setTooltip(null);
        }
    }, [camera, meshToExperience]);

    // Set up event listeners
    useEffect(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return;

        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('touchmove', handlePointerMove);

        return () => {
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('touchmove', handlePointerMove);
        };
    }, [handlePointerMove]);

    // Update mesh materials based on experiences
    const updateMeshMaterials = useCallback((experiences: Experience[]) => {
        if (!meshRef.current) return;

        // Reset all meshes to default state
        meshRef.current.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                const defaultMaterial = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(0xcccccc), // Light gray
                    emissive: new THREE.Color(0x000000),
                    emissiveIntensity: 0,
                    transparent: true,
                    opacity: 0.7,
                    shininess: 10,
                    specular: new THREE.Color(0x111111),
                    flatShading: false
                });
                object.material = defaultMaterial;
            }
        });

        // Create a map of mesh names to their experiences
        const meshToExperience = new Map<string, Experience>();
        experiences.forEach(exp => {
            const meshNames = BRAIN_REGION_TO_MESH[exp.brain_regions[0]] || []; // Use first brain region
            meshNames.forEach(meshName => {
                // If a mesh already has an experience, only update if new experience has higher intensity
                const currentExp = meshToExperience.get(meshName);
                if (!currentExp || exp.intensity > currentExp.intensity) {
                    meshToExperience.set(meshName, exp);
                }
            });
        });

        // Apply materials based on experiences
        let highlightedCount = 0;
        meshToExperience.forEach((exp, meshName) => {
            const mesh = meshRef.current?.getObjectByName(meshName) as THREE.Mesh;
            if (mesh) {
                const color = EXPERIENCE_COLORS[exp.type] || '#ffffff';
                const material = createExperienceMaterial(color, exp.intensity);
                mesh.material = material;
                highlightedCount++;
                console.log(`Highlighted mesh ${meshName} with color ${color} at intensity ${exp.intensity}`);
            }
        });

        console.log(`Updated materials: ${highlightedCount} meshes highlighted`);
    }, []);

    useEffect(() => {
        updateMeshMaterials(convertExperiences(experiences));
    }, [experiences, convertExperiences, updateMeshMaterials]);

    // Animation frame for hover effects
    useFrame(() => {
        if (!meshRef.current) return;

        meshRef.current.traverse((node: THREE.Object3D) => {
            if ((node as THREE.Mesh).isMesh) {
                const mat = (node as THREE.Mesh).material as THREE.MeshStandardMaterial;
                if (mat) {
                    if (node === hoveredMesh) {
                        mat.emissiveIntensity = Math.min(mat.emissiveIntensity + 0.1, 1);
                        node.scale.lerp(new THREE.Vector3(1.1, 1.1, 1.1), 0.1);
                    } else {
                        node.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
                    }
                }
            }
        });
    });

    return (
        <>
            <group ref={meshRef} dispose={null}>
                <primitive object={scene} scale={1} />
            </group>
            {tooltip && tooltip.experience?.type && (
                <Html
                    position={[0, 0, 0]}
                    style={{
                        position: 'absolute',
                        left: tooltip.position.x,
                        top: tooltip.position.y,
                        transform: 'translate(-50%, -100%)',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        opacity: hoveredMesh ? 1 : 0,
                        transition: 'opacity 0.2s'
                    }}
                >
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs">
                        <h3 className="font-semibold text-gray-900 mb-1">
                            {formatText(tooltip.region)}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            {BRAIN_REGION_DESCRIPTIONS[tooltip.region] || ''}
                        </p>
                        <div className="text-sm">
                            <p className="font-medium text-gray-700">
                                Activation Level: {Math.round(calculateRegionActivation(tooltip.region, [tooltip.experience]) * 100)}%
                            </p>
                            <p className="text-gray-600 italic">
                                "{tooltip.experience.evidence}"
                            </p>
                        </div>
                    </div>
                </Html>
            )}
            {/* Add activation level legend */}
            <Html position={[0, 0, 0]} style={{ position: 'absolute', bottom: 20, left: 20 }}>
                <div className="bg-white/90 rounded-lg p-3 shadow-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Activation Levels</h4>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ff0000' }} />
                            <span className="text-xs text-gray-600">High Activation (70-100%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00ff00' }} />
                            <span className="text-xs text-gray-600">Medium Activation (30-70%)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0000ff' }} />
                            <span className="text-xs text-gray-600">Low Activation (0-30%)</span>
                        </div>
                    </div>
                </div>
            </Html>
        </>
    );
}

export default function BrainMeshViewer(props: BrainMeshViewerProps) {
    return (
        <Canvas 
            style={{ width: '100%', height: '500px' }} 
            camera={{ position: [0, 0, 5], fov: 45 }}
            dpr={[1, 2]} // Optimize for mobile
        >
            <ambientLight intensity={0.5} />
            <directionalLight position={[1, 1, 1]} intensity={0.8} />
            <BrainMesh experiences={props.experiences} />
            <OrbitControls 
                enableDamping 
                dampingFactor={0.05}
                rotateSpeed={0.5}
                minDistance={3}
                maxDistance={10}
            />
        </Canvas>
    );
}