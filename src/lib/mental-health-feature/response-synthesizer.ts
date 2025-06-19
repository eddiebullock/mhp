import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const disclaimer = 'This information is for educational purposes only and is not a substitute for professional medical advice. If you are in crisis, please seek immediate help.';

export async function synthesizeResponse(question: string, papers: any[]) {
  const context = papers.map((p, i) => `Paper ${i + 1}: ${p.title} (${p.year}) by ${p.authors}. ${p.abstract}`).join('\n');
  const prompt = `You are a compassionate mental health assistant.\n\nUser question: ${question}\n\nRelevant research papers:\n${context}\n\nBased on the above, provide:\n1. A natural language summary addressing the question\n2. Evidence-based recommendations\n3. Reference specific studies\n4. Practical, actionable advice\n5. Always include this disclaimer: ${disclaimer}\n\nFormat: Summary → Key Findings → Recommendations → Sources`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a compassionate, evidence-based mental health assistant.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });
  return { response: completion.choices[0].message?.content || '', papers };
} 