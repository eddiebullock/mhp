import nlp from 'compromise';

const academicMappings: Record<string, string> = {
  'feeling low': 'depression',
  'can\'t sleep': 'insomnia',
  'worried': 'anxiety',
  'sad': 'depression',
  'happy': 'wellbeing',
  // Add more mappings as needed
};

const academicModifiers = [
  'systematic review',
  'meta-analysis',
  'randomized controlled trial',
  'longitudinal study',
  'effect size',
  'confidence interval'
];

export function processAcademicQuery(userQuery: string) {
  // Lowercase and basic cleanup
  const cleaned = userQuery.toLowerCase();
  // Keyword extraction
  const doc = nlp(cleaned);
  let keywords = doc.nouns().out('array');
  if (keywords.length === 0) {
    keywords = cleaned.split(/\s+/).filter(w => w.length > 3);
  }
  // Map colloquial to academic/medical
  const mapped = keywords.map((k: string) => academicMappings[k] || k);
  // Build a focused search query
  const mainTerms = Array.from(new Set([...keywords, ...mapped])).filter(Boolean);
  const searchQuery = mainTerms.join(' ');
  return {
    originalQuery: userQuery,
    keywords: mainTerms,
    searchQuery,
    enhancedQueries: academicModifiers.map(modifier => `${searchQuery} ${modifier}`),
    studyTypes: ['systematic review', 'meta-analysis', 'RCT'],
    minSampleSize: 50,
    recencyWeight: 'last_10_years'
  };
} 