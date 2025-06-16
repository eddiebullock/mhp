import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

interface VisualizationRequest {
    experiences: {
        type: string;
        intensity: number;
        brain_regions: string[];
    }[];
}

export async function POST(request: Request) {
    try {
        const data: VisualizationRequest = await request.json();
        
        // Get the path to the Python executable in the virtual environment
        const pythonPath = path.join(process.cwd(), 'venv', 'bin', 'python3');
        const pythonScript = path.join(process.cwd(), 'scripts', 'visualize_brain.py');

        console.log('Using Python at:', pythonPath);
        console.log('Script path:', pythonScript);
        console.log('Input data:', JSON.stringify(data, null, 2));

        // Call Python script with virtual environment Python
        const pythonProcess = spawn(pythonPath, [pythonScript, JSON.stringify(data)]);

        let visualizationData = '';
        let errorData = '';

        // Collect data from Python script
        pythonProcess.stdout.on('data', (data) => {
            console.log('Python stdout:', data.toString());
            visualizationData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error('Python stderr:', data.toString());
            errorData += data.toString();
        });

        // Wait for Python script to complete
        await new Promise((resolve, reject) => {
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(null);
                } else {
                    console.error('Python script failed with code:', code);
                    console.error('Error output:', errorData);
                    reject(new Error(`Python script exited with code ${code}: ${errorData}`));
                }
            });
        });

        // Parse the visualization data
        const result = JSON.parse(visualizationData);
        console.log('Visualization result:', result);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in visualize-brain:', error);
        return NextResponse.json(
            { error: 'Failed to generate brain visualization: ' + (error instanceof Error ? error.message : String(error)) },
            { status: 500 }
        );
    }
} 