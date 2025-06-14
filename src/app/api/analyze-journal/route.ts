import { createServerClient } from '@supabase/ssr';
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
const SYSTEM_PROMPT = `You are a neuroscience expert analyzing journal entries. Extract psychological experiences and rate their intensity (0-1 scale).

Valid experiences: anxiety, stress, happiness, sadness, anger, exercise, social_interaction, learning, creativity, meditation, sleep_quality

You MUST respond with ONLY a valid JSON object in this exact format, with no additional text or explanation:
{
  "experiences": [
    {
      "type": "experience_type",
      "intensity": 0.0-1.0,
      "evidence": "exact quote from journal that indicates this"
    }
  ]
}

Do not include any markdown formatting, backticks, or additional text. Return ONLY the JSON object.`;

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { get: (name) => cookieStore.get(name)?.value } }
        );
        
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
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Journal entry: "${content}"` }
            ],
            response_format: { type: "json_object" }
        });

        let analysis;
        try {
            const responseContent = completion.choices[0].message.content;
            if (!responseContent) {
                throw new Error('Empty response from GPT');
            }
            // Remove any potential markdown formatting
            const cleanContent = responseContent.replace(/```json\n?|\n?```/g, '').trim();
            analysis = JSON.parse(cleanContent);
        } catch (error) {
            console.error('Error parsing GPT response:', error);
            console.error('Raw response:', completion.choices[0].message.content);
            throw new Error('Invalid response format from GPT');
        }

        // Validate the analysis structure
        if (!analysis.experiences || !Array.isArray(analysis.experiences)) {
            throw new Error('Invalid analysis structure: missing experiences array');
        }

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