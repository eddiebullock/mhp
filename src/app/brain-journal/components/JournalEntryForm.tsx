'use client';

import { useState } from 'react';

interface JournalEntryFormProps {
    onSubmit: (content: string) => Promise<void>;
    isAnalyzing: boolean;
}

export default function JournalEntryForm({ onSubmit, isAnalyzing }: JournalEntryFormProps) {
    const [content, setContent] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        await onSubmit(content);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Write Your Journal Entry
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label 
                        htmlFor="journal-content" 
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        How was your day? Write about your experiences, emotions, and activities.
                    </label>
                    <textarea
                        id="journal-content"
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Today I felt..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isAnalyzing}
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!content.trim() || isAnalyzing}
                        className={`
                            px-4 py-2 rounded-md text-white font-medium
                            ${!content.trim() || isAnalyzing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700'
                            }
                        `}
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
} 