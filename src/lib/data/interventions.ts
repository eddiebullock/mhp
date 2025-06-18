import { createClient } from '@/lib/supabase';
import { ArticleCategory } from '@/types/supabase';
import { Database } from '@/types/supabase';

type Article = Database['public']['Tables']['articles']['Row'];

export type Intervention = {
  id: string;
  slug: string;
  title: string;
  category: ArticleCategory;
  evidenceStrength: 'Strong' | 'Moderate' | 'Limited' | 'Insufficient';
  studyCount: number;
  reliabilityRating: number;
  conditions: string[];
  summary: string;
  content: Article['content_blocks'];
  tags: string[];
  status: Article['status'];
};

const supabase = createClient();

// Map frontend categories to database categories and search strategies
const categoryMap = {
  lifestyle: {
    categories: ['lifestyle_factors', 'brain_health', 'mental_health'] as ArticleCategory[],
    keywords: ['lifestyle', 'diet', 'exercise', 'sleep', 'nutrition', 'wellness', 'health', 'fitness', 'wellbeing', 'lifestyle factor', 'modifiable', 'environment', 'social', 'physical activity', 'mindfulness', 'meditation', 'stress management', 'self-care'],
    type: 'lifestyle'
  },
  clinical: {
    categories: ['interventions', 'mental_health'] as ArticleCategory[],
    keywords: ['therapy', 'medication', 'treatment', 'intervention', 'clinical', 'therapeutic', 'cbt', 'meditation', 'mindfulness'],
    type: 'clinical'
  },
  risk_factor: {
    categories: ['mental_health', 'neuroscience', 'psychology'] as ArticleCategory[],
    keywords: ['risk', 'factor', 'cause', 'trigger', 'vulnerability', 'predisposition', 'etiology'],
    type: 'risk_factor'
  }
};

// Enhanced condition mapping with synonyms and variations
const conditionMap = {
  'depression': ['depression', 'depressive', 'mood disorder', 'major depressive disorder', 'mdd', 'dysthymia'],
  'anxiety': ['anxiety', 'anxious', 'anxiety disorder', 'generalized anxiety', 'gad', 'panic', 'worry'],
  'ptsd': ['ptsd', 'post traumatic stress', 'post-traumatic stress', 'trauma', 'traumatic stress', 'posttraumatic'],
  'ocd': ['ocd', 'obsessive compulsive', 'obsessive-compulsive', 'obsession', 'compulsion'],
  'adhd': ['adhd', 'attention deficit', 'attention-deficit', 'hyperactivity', 'attention disorder'],
  'bipolar': ['bipolar', 'manic', 'mania', 'bipolar disorder', 'manic depression'],
  'eating_disorder': ['eating disorder', 'anorexia', 'bulimia', 'binge eating', 'arfid', 'pica'],
  'sleep_disorder': ['sleep disorder', 'insomnia', 'sleep apnea', 'narcolepsy', 'sleep problem', 'sleep issue'],
  'substance_use': ['substance use', 'addiction', 'alcohol', 'drug', 'substance abuse', 'substance dependence'],
  'personality_disorder': ['personality disorder', 'borderline', 'narcissistic', 'antisocial', 'avoidant', 'dependent'],
  'schizophrenia': ['schizophrenia', 'psychosis', 'psychotic', 'schizoaffective', 'delusional'],
  'autism': ['autism', 'autistic', 'asd', 'autism spectrum', 'neurodiversity'],
  'stress': ['stress', 'stressed', 'stressful', 'stress management', 'stress reduction'],
  'trauma': ['trauma', 'traumatic', 'trauma therapy', 'trauma treatment', 'trauma-informed'],
  'mood_disorder': ['mood disorder', 'mood', 'emotional regulation', 'mood regulation', 'mood stabilization']
};

export async function getInterventions(category: keyof typeof categoryMap) {
  const config = categoryMap[category];
  
  console.log(`Fetching ${category} interventions...`);
  
  try {
    // Get articles from relevant categories
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .in('category', config.categories)
      .order('created_at', { ascending: false })
      .limit(200); // Get more articles to work with

    if (error) {
      console.error('Error fetching interventions:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} articles in categories: ${config.categories.join(', ')}`);

    // Filter and score articles based on category relevance
    const relevantArticles = data?.filter(article => {
      const title = article.title.toLowerCase();
      const summary = article.summary.toLowerCase();
      const tags = (article.tags || []).map((t: string) => t.toLowerCase());
      const contentText = JSON.stringify(article.content_blocks || {}).toLowerCase();
      
      // Check if article matches category keywords
      return config.keywords.some(keyword => 
        title.includes(keyword) || 
        summary.includes(keyword) || 
        tags.some((tag: string) => tag.includes(keyword)) ||
        contentText.includes(keyword)
      );
    }) || [];

    console.log(`Filtered to ${relevantArticles.length} relevant ${category} articles`);

    // Transform the data to match our Intervention type
    return relevantArticles.map((article): Intervention => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      category: article.category,
      evidenceStrength: determineEvidenceStrength(article),
      studyCount: countStudies(article),
      reliabilityRating: determineReliability(article),
      conditions: article.tags || [],
      summary: article.summary || '',
      content: article.content_blocks,
      tags: article.tags || [],
      status: article.status,
    }));

  } catch (error) {
    console.error('Error in getInterventions:', error);
    throw error;
  }
}

export async function getInterventionsByCondition(
  category: keyof typeof categoryMap,
  condition: string
) {
  const config = categoryMap[category];
  
  console.log(`Filtering ${category} for condition: ${condition}`);
  
  try {
    // Get articles from relevant categories
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .in('category', config.categories)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error fetching interventions by condition:', error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} articles in categories: ${config.categories.join(', ')}`);

    // Get condition keywords
    const conditionKeywords = conditionMap[condition as keyof typeof conditionMap] || [condition];
    console.log(`Searching for condition keywords: ${conditionKeywords.join(', ')}`);

    // Filter by condition with comprehensive matching
    const filteredData = data?.filter((article) => {
      const title = article.title.toLowerCase();
      const summary = article.summary.toLowerCase();
      const tags = (article.tags || []).map((t: string) => t.toLowerCase());
      const contentText = JSON.stringify(article.content_blocks || {}).toLowerCase();
      
      // Check if article matches category keywords
      const categoryMatch = config.keywords.some(keyword => 
        title.includes(keyword) || 
        summary.includes(keyword) || 
        tags.some((tag: string) => tag.includes(keyword)) ||
        contentText.includes(keyword)
      );
      
      // Check if article matches condition keywords
      const conditionMatch = conditionKeywords.some(keyword => 
        title.includes(keyword) || 
        summary.includes(keyword) || 
        tags.some((tag: string) => tag.includes(keyword)) ||
        contentText.includes(keyword)
      );
      
      const isMatch = categoryMatch && conditionMatch;
      
      if (isMatch) {
        console.log(`Match found: ${article.title} (tags: ${article.tags?.join(', ')})`);
      }
      
      return isMatch;
    }) || [];

    console.log(`Filtered to ${filteredData.length} articles for condition: ${condition}`);

    return filteredData.map((article): Intervention => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      category: article.category,
      evidenceStrength: determineEvidenceStrength(article),
      studyCount: countStudies(article),
      reliabilityRating: determineReliability(article),
      conditions: article.tags || [],
      summary: article.summary || '',
      content: article.content_blocks,
      tags: article.tags || [],
      status: article.status,
    }));

  } catch (error) {
    console.error('Error in getInterventionsByCondition:', error);
    throw error;
  }
}

// Helper functions for determining evidence strength and reliability
function determineEvidenceStrength(article: Article): 'Strong' | 'Moderate' | 'Limited' | 'Insufficient' {
  const evidenceText = article.content_blocks?.evidence_summary?.toLowerCase() || '';
  const keyStudiesText = article.content_blocks?.key_studies?.toLowerCase() || '';
  
  if (evidenceText.includes('strong') || evidenceText.includes('robust') || evidenceText.includes('extensive')) {
    return 'Strong';
  } else if (evidenceText.includes('moderate') || evidenceText.includes('good') || evidenceText.includes('substantial')) {
    return 'Moderate';
  } else if (evidenceText.includes('limited') || evidenceText.includes('some') || evidenceText.includes('emerging')) {
    return 'Limited';
  } else if (keyStudiesText.split('\n').length > 5) {
    return 'Moderate'; // If there are many studies mentioned, assume moderate evidence
  } else {
    return 'Insufficient';
  }
}

function countStudies(article: Article): number {
  const keyStudiesText = article.content_blocks?.key_studies || '';
  if (!keyStudiesText) return 0;
  
  // Count lines that look like study references
  const lines = keyStudiesText.split('\n').filter(line => 
    line.trim().length > 0 && 
    (line.includes('(') || line.includes('et al') || line.includes('study') || line.includes('research'))
  );
  
  return Math.max(lines.length, 1); // At least 1 study
}

function determineReliability(article: Article): number {
  // Base reliability on content quality indicators
  let score = 3; // Base score
  
  const contentBlocks = article.content_blocks || {};
  const summary = article.summary || '';
  
  // Bonus for comprehensive content
  if (Object.keys(contentBlocks).length > 5) score += 1;
  if (summary.length > 200) score += 1;
  
  // Bonus for evidence-based content
  if (contentBlocks.evidence_summary) score += 1;
  if (contentBlocks.key_studies) score += 1;
  
  // Bonus for practical content
  if (contentBlocks.practical_takeaways || contentBlocks.practical_applications) score += 1;
  
  // Ensure score is between 1-5
  return Math.min(5, Math.max(1, score));
} 