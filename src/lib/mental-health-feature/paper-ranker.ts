type Paper = {
  title: string;
  authors: string;
  journal: string;
  year: number | string;
  url: string;
  abstract: string;
  source: string;
  [key: string]: any;
};

const studyTypeHierarchy = [
  'systematic review',
  'meta-analysis',
  'randomized controlled trial',
  'RCT',
  'case study',
];

function scorePaper(paper: Paper, query: { keywords: string[]; category: string }) {
  let score = 0;
  // Relevance: keyword match in title/abstract
  const text = `${paper.title} ${paper.abstract}`.toLowerCase();
  for (const kw of query.keywords) {
    if (text.includes(kw.toLowerCase())) score += 2;
  }
  // Recency: last 5-10 years
  const year = parseInt(paper.year as string);
  if (!isNaN(year)) {
    const now = new Date().getFullYear();
    if (year >= now - 2) score += 3;
    else if (year >= now - 5) score += 2;
    else if (year >= now - 10) score += 1;
  }
  // Study type
  for (let i = 0; i < studyTypeHierarchy.length; i++) {
    if (text.includes(studyTypeHierarchy[i])) {
      score += (studyTypeHierarchy.length - i) * 2;
      break;
    }
  }
  // TODO: Journal quality/impact factor (future)
  // TODO: Citation count (future)
  return score;
}

export function rankAndSelectPapers(allResults: Paper[], query: { keywords: string[]; category: string }) {
  const scored = allResults.map(p => ({ ...p, relevanceScore: scorePaper(p, query) }));
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, 8);
} 