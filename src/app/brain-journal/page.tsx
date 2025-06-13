import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BrainJournalClient from './BrainJournalClient';

export default async function BrainJournalPage() {
    const supabase = createServerComponentClient({ cookies });
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">
                    Brain Journal
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Write about your day and explore how your experiences map to different regions of your brain.
                    This tool helps you understand the neuroscience behind your emotions and activities.
                </p>
                <BrainJournalClient />
            </div>
        </div>
    );
} 