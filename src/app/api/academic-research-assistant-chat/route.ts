import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { processAcademicQuery } from '@/lib/academic-research-assistant-feature/query-processor';
import { searchAllAcademicAPIs } from '@/lib/academic-research-assistant-feature/search-all-apis';
import { rankAndSelectAcademicPapers } from '@/lib/academic-research-assistant-feature/paper-ranker';
import { synthesizeAcademicResponse } from '@/lib/academic-research-assistant-feature/response-synthesizer';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const authorizedEditors = [
    'eddie@mentalhealthprogram.co.uk',
    'daughterofthes3a@gmail.com'
    // Add more authorized editor emails here as needed
  ];
  if (!user || !authorizedEditors.includes(user.email || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { question } = await req.json();
  if (!question) {
    return NextResponse.json({ error: 'Missing question' }, { status: 400 });
  }
  // Academic query processing
  const processedQuery = processAcademicQuery(question);
  // Academic search (can use the same logic as searchAllAPIs for now)
  const allResults = await searchAllAcademicAPIs(processedQuery);
  // Academic paper ranking
  const papers = rankAndSelectAcademicPapers(allResults);
  // Academic response synthesis
  const academicResponse = await synthesizeAcademicResponse(question, papers);
  return NextResponse.json(academicResponse);
} 