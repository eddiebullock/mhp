'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import dynamic from 'next/dynamic';
import JournalEntryForm from './components/JournalEntryForm';
import AnalysisResults from './components/AnalysisResults';

// Dynamically import the brain viewer component to avoid SSR issues with Three.js
const BrainViewer = dynamic(() => import('./components/BrainViewer'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Loading brain visualization...</p>
        </div>
    )
});

interface Experience {
    type: string;
    intensity: number;
    evidence: string;
    brain_regions: string[];
}

interface AnalysisData {
    journal_entry: {
        id: string;
        content: string;
        created_at: string;
    };
    analysis: {
        id: string;
        brain_data: Experience[];
    };
    experiences: Experience[];
}

export default function BrainJournalClient() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClientComponentClient();

    const handleJournalSubmit = async (content: string) => {
        try {
            setIsAnalyzing(true);
            setError(null);

            const response = await fetch('/api/analyze-journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze journal entry');
            }

            const data = await response.json();
            setAnalysisData(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <JournalEntryForm 
                    onSubmit={handleJournalSubmit}
                    isAnalyzing={isAnalyzing}
                />
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                {analysisData && (
                    <AnalysisResults 
                        experiences={analysisData.experiences}
                        journalEntry={analysisData.journal_entry}
                    />
                )}
            </div>
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        Brain Visualization
                    </h2>
                    <div className="aspect-square w-full">
                        <BrainViewer 
                            experiences={analysisData?.experiences || []}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 