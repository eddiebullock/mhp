import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

export async function synthesizeAcademicResponse(userQuery: string, selectedPapers: any[]) {
  // Only send the top 5 papers by quality to the LLM
  const topPapers = (selectedPapers || [])
    .slice() // shallow copy
    .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
    .slice(0, 5);
  // Build the academic prompt
  const prompt = `
You are an expert academic research assistant specializing in mental health research synthesis. You are helping a researcher write an evidence-based article similar to those on examine.com.

Research Question: "${userQuery}"

Available Research Papers (prioritized by quality):
${topPapers.map(paper => `
Title: ${paper.title}
Authors: ${paper.authors}
Journal: ${paper.journal}
Year: ${paper.year}
Study Type: ${paper.studyType || ''}
Sample Size: ${paper.sampleSize || ''}
Key Statistics: ${paper.statistics || ''}
Abstract: ${paper.abstract}
Quality Score: ${paper.overallScore || ''}/10
APA Citation: ${paper.apaFormat || ''}
`).join('\n')}

INSTRUCTIONS:
- Use ONLY the provided research papers for your synthesis. Do NOT hallucinate data or invent studies.
- For all narrative sections, use in-text citations in the format [Author, Year] that match the citation list at the end.
- Extract and report effect sizes, sample sizes, and study details from the provided papers. If unavailable, state "Not reported" and add a warning in the output.
- At the end, include a 'References' section listing all cited studies in APA format (from the provided papers).
- If any key data (effect size, sample size) is missing, add a warning in a 'warnings' array in the JSON output.
- Output must be valid JSON with the following structure:
{
  "executiveSummary": "...",
  "currentConsensus": "...",
  "effectSizes": [ ... ],
  "keyFindings": [ ... ],
  "methodologicalConsiderations": [ ... ],
  "researchGaps": [ ... ],
  "practicalImplications": "...",
  "citations": [ ... ],
  "references": [ ... ],
  "warnings": [ ... ],
  "searchStrategy": { ... }
}
- Do NOT include any information not present in the provided papers.
- If you cannot answer a section, state "Insufficient data from provided papers."
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1200,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    const messageContent = completion.choices[0].message.content;
    if (!messageContent) throw new Error('No content in GPT response');
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(messageContent);
      // Strictly filter effectSizes and keyFindings for real, structured data only
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.effectSizes)) {
          parsed.effectSizes = parsed.effectSizes.filter(
            (es: any) => es && typeof es === 'object' &&
              Object.values(es).some(
                v => v && typeof v === 'string' && v.trim() !== '' && !['Not reported', 'N/A', 'NA', 'not reported'].includes(v.trim())
              )
          );
        }
        if (Array.isArray(parsed.keyFindings)) {
          parsed.keyFindings = parsed.keyFindings.filter(
            (kf: any) => kf && typeof kf === 'object' &&
              Object.values(kf).some(
                v => v && typeof v === 'string' && v.trim() !== '' && !['Not reported', 'N/A', 'NA', 'not reported'].includes(v.trim())
              )
          );
        }
        // Always ensure methodologicalConsiderations is an array
        if (!Array.isArray(parsed.methodologicalConsiderations)) {
          parsed.methodologicalConsiderations = Array.isArray(parsed.methodologicalConsiderations)
            ? parsed.methodologicalConsiderations
            : (parsed.methodologicalConsiderations ? [parsed.methodologicalConsiderations] : []);
        }
      }
      return parsed;
    } catch (err) {
      // If not valid JSON, return as text in a fallback format
      return { executiveSummary: 'Could not parse LLM response as JSON.', raw: messageContent };
    }
  } catch (error: any) {
    return {
      executiveSummary: 'Error generating academic response.',
      error: error.message || String(error)
    };
  }
} 