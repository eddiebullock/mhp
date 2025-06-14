import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function inspectModel(modelPath) {
    console.log(`\nInspecting ${modelPath}...`);
    try {
        const fullPath = path.join(__dirname, '..', 'public', 'models', modelPath);
        console.log('Full path:', fullPath);
        
        if (!fs.existsSync(fullPath)) {
            console.error(`File not found: ${fullPath}`);
            return;
        }

        const loader = new GLTFLoader();
        const gltf = await new Promise((resolve, reject) => {
            loader.load(
                fullPath,
                (gltf) => resolve(gltf),
                undefined,
                (error) => reject(error)
            );
        });
        
        console.log('Model loaded successfully!');
        console.log('Meshes found:');
        
        gltf.scene.traverse((node) => {
            if (node.isMesh) {
                console.log(`- ${node.name}`);
            }
        });
        
    } catch (error) {
        console.error(`Error loading ${modelPath}:`, error.message);
    }
}

// Run inspection for each model
const models = [
    'brain_areas.glb',
    'brain human.glb',
    'brain_hologram.glb'
];

Promise.all(models.map(model => inspectModel(model)))
    .then(() => console.log('\nInspection complete!'))
    .catch(console.error); 