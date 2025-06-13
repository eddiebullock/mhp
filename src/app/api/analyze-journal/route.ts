import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Brain region mapping for different experiences
const BRAIN_REGION_MAPPING: Record<string, string[]> = {
    anxiety: ['amygdala', 'prefrontal_cortex', 'hippocampus'],
    stress: ['amygdala', 'hypothalamus', 'prefrontal_cortex'],
    happiness: ['nucleus_accumbens', 'ventral_tegmental_area', 'prefrontal_cortex'],
    exercise: ['motor_cortex', 'cerebellum', 'basal_ganglia'],
    social_interaction: ['temporal_lobe', 'prefrontal_cortex', 'mirror_neurons'],
    learning: ['hippocampus', 'prefrontal_cortex', 'cerebellum'],
    creativity: ['prefrontal_cortex', 'temporal_lobe', 'parietal_lobe'],
    meditation: ['prefrontal_cortex', 'insula', 'anterior_cingulate_cortex']
};

// GPT system prompt for analysis
const SYSTEM_PROMPT = `You are a psychological analysis assistant. Analyze the journal entry and extract psychological experiences.
For each experience, provide:
1. The type of experience (must be one of: anxiety, stress, happiness, exercise, social_interaction, learning, creativity, meditation)
2. Intensity level (0-1, where 0 is minimal and 1 is maximum)
3. A direct quote from the text that evidences this experience

Format your response as a JSON array of objects with these fields:
{
    "experiences": [
        {
            "type": "experience_type",
            "intensity": 0.0-1.0,
            "evidence": "quote from text"
        }
    ]
}`;

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        
        // Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get journal entry from request
        const { content } = await request.json();
        if (!content) {
            return NextResponse.json({ error: 'Journal content is required' }, { status: 400 });
        }

        // Call GPT-4 for analysis
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content }
            ],
            response_format: { type: "json_object" }
        });

        const analysis = JSON.parse(completion.choices[0].message.content);

        // Create journal entry in database
        const { data: journalEntry, error: journalError } = await supabase
            .from('journal_entries')
            .insert({
                user_id: session.user.id,
                content
            })
            .select()
            .single();

        if (journalError) throw journalError;

        // Process experiences and create brain data
        const brainData = analysis.experiences.map((exp: any) => ({
            type: exp.type,
            intensity: exp.intensity,
            evidence: exp.evidence,
            brain_regions: BRAIN_REGION_MAPPING[exp.type] || []
        }));

        // Store analysis results
        const { data: entryAnalysis, error: analysisError } = await supabase
            .from('entry_analyses')
            .insert({
                entry_id: journalEntry.id,
                gpt_response: analysis,
                brain_data: brainData
            })
            .select()
            .single();

        if (analysisError) throw analysisError;

        // Store individual experiences
        const experiences = analysis.experiences.map((exp: any) => ({
            analysis_id: entryAnalysis.id,
            experience_type: exp.type,
            intensity: exp.intensity,
            evidence_quote: exp.evidence,
            brain_regions: BRAIN_REGION_MAPPING[exp.type] || []
        }));

        const { error: experiencesError } = await supabase
            .from('experiences')
            .insert(experiences);

        if (experiencesError) throw experiencesError;

        return NextResponse.json({
            success: true,
            data: {
                journal_entry: journalEntry,
                analysis: entryAnalysis,
                experiences
            }
        });

    } catch (error) {
        console.error('Error analyzing journal entry:', error);
        return NextResponse.json(
            { error: 'Failed to analyze journal entry' },
            { status: 500 }
        );
    }
} 