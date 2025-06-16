import { useEffect, useState } from 'react';
import type { APIExperience } from '../types';

interface BrainVisualizationProps {
    experiences: APIExperience[];
}

interface VisualizationData {
    visualization: string;
    regions: string[];
    max_intensity: number;
}

export default function BrainVisualization({ experiences }: BrainVisualizationProps) {
    const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function generateVisualization() {
            if (!experiences.length) return;

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/visualize-brain', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ experiences }),
                });

                if (!response.ok) {
                    throw new Error('Failed to generate visualization');
                }

                const data = await response.json();
                setVisualizationData(data);
            } catch (err) {
                console.error('Error generating visualization:', err);
                setError('Failed to generate brain visualization');
            } finally {
                setIsLoading(false);
            }
        }

        generateVisualization();
    }, [experiences]);

    if (isLoading) {
        return (
            <div className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-lg flex items-center justify-center">
                <div className="text-gray-500">Generating brain visualization...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-lg flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!visualizationData) {
        return (
            <div className="w-full h-full min-h-[500px] bg-white rounded-lg shadow-lg flex items-center justify-center">
                <div className="text-gray-500">No visualization available</div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">Brain Activation Map</h3>
                <div className="relative w-full aspect-[3/1]">
                    <img
                        src={visualizationData.visualization}
                        alt="Brain activation visualization"
                        className="w-full h-full object-contain"
                    />
                </div>
                <div className="mt-4">
                    <h4 className="font-medium mb-2">Active Brain Regions:</h4>
                    <div className="flex flex-wrap gap-2">
                        {visualizationData.regions.map((region) => (
                            <span
                                key={region}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                                {region.replace('_', ' ')}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 