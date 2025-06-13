'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Experience {
    type: string;
    intensity: number;
    evidence: string;
    brain_regions: string[];
}

interface BrainViewerProps {
    experiences: Experience[];
}

// Brain region coordinates (simplified for demonstration)
const BRAIN_REGION_COORDINATES: Record<string, { x: number; y: number; z: number; radius: number }> = {
    amygdala: { x: -0.3, y: -0.2, z: -0.1, radius: 0.1 },
    prefrontal_cortex: { x: 0, y: 0.3, z: 0.2, radius: 0.15 },
    hippocampus: { x: -0.2, y: -0.1, z: 0.1, radius: 0.12 },
    hypothalamus: { x: 0, y: -0.2, z: 0, radius: 0.08 },
    nucleus_accumbens: { x: -0.2, y: -0.1, z: 0.2, radius: 0.07 },
    ventral_tegmental_area: { x: 0, y: -0.3, z: 0.1, radius: 0.06 },
    motor_cortex: { x: 0.3, y: 0, z: 0.2, radius: 0.14 },
    cerebellum: { x: 0, y: -0.4, z: 0.1, radius: 0.2 },
    basal_ganglia: { x: -0.2, y: 0, z: 0.2, radius: 0.12 },
    temporal_lobe: { x: -0.4, y: 0, z: 0, radius: 0.15 },
    mirror_neurons: { x: 0.2, y: 0, z: 0.3, radius: 0.1 },
    parietal_lobe: { x: 0.3, y: 0.1, z: 0.1, radius: 0.15 },
    insula: { x: -0.3, y: 0, z: 0.2, radius: 0.09 },
    anterior_cingulate_cortex: { x: 0, y: 0.1, z: 0.3, radius: 0.11 }
};

export default function BrainViewer({ experiences }: BrainViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const brainMeshRef = useRef<THREE.Mesh | null>(null);
    const regionMeshesRef = useRef<THREE.Mesh[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        sceneRef.current = scene;

        // Initialize camera
        const camera = new THREE.PerspectiveCamera(
            75,
            containerRef.current.clientWidth / containerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.z = 2;
        cameraRef.current = camera;

        // Initialize renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Add orbit controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controlsRef.current = controls;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Create brain mesh (simplified as a sphere for demonstration)
        const brainGeometry = new THREE.SphereGeometry(1, 32, 32);
        const brainMaterial = new THREE.MeshPhongMaterial({
            color: 0x94a3b8,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const brainMesh = new THREE.Mesh(brainGeometry, brainMaterial);
        scene.add(brainMesh);
        brainMeshRef.current = brainMesh;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle window resize
        const handleResize = () => {
            if (!containerRef.current || !camera || !renderer) return;
            
            camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current && renderer.domElement) {
                containerRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    // Update brain regions based on experiences
    useEffect(() => {
        if (!sceneRef.current || !brainMeshRef.current) return;

        // Remove existing region meshes
        regionMeshesRef.current.forEach(mesh => {
            sceneRef.current?.remove(mesh);
        });
        regionMeshesRef.current = [];

        // Create new region meshes for each experience
        experiences.forEach(experience => {
            experience.brain_regions.forEach(region => {
                const coordinates = BRAIN_REGION_COORDINATES[region];
                if (!coordinates) return;

                const intensity = experience.intensity;
                const geometry = new THREE.SphereGeometry(coordinates.radius, 16, 16);
                const material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(1, 1 - intensity, 1 - intensity),
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(coordinates.x, coordinates.y, coordinates.z);
                sceneRef.current?.add(mesh);
                regionMeshesRef.current.push(mesh);
            });
        });
    }, [experiences]);

    return (
        <div 
            ref={containerRef} 
            className="w-full h-full min-h-[500px] rounded-lg overflow-hidden"
        />
    );
} 