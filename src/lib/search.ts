import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Article = Database['public']['Tables']['articles']['Row'];

const supabase = createClient();

export async function semanticSearch(query: string): Promise<{ answer: string; articles: Article[] }> {
  try {
    console.log('Searching for:', query);
    
    const queryLower = query.toLowerCase().trim();
    const searchTerms = extractSearchTerms(queryLower);
    
    console.log('Search terms:', searchTerms);
    
    // Strategy 1: Direct database search for exact matches
    const exactMatches = await searchExactMatches(searchTerms);
    
    // Strategy 2: Broader search for related content
    const relatedMatches = await searchRelatedContent(searchTerms);
    
    // Strategy 3: Category-based search
    const categoryMatches = await searchByCategory(queryLower);
    
    // Combine and deduplicate results
    const allResults = [...exactMatches, ...relatedMatches, ...categoryMatches];
    const uniqueResults = deduplicateArticles(allResults);
    
    // Score and rank all results
    const scoredResults = scoreArticles(uniqueResults, queryLower, searchTerms);
    
    console.log('Found articles:', scoredResults.length);

    if (scoredResults.length === 0) {
      return {
        answer: `I couldn't find any articles related to "${query}". Try searching for different terms or browse our categories.`,
        articles: []
      };
    }

    // Generate a simple answer based on the found articles
    const answer = generateSimpleAnswer(scoredResults, query);

    return {
      answer,
      articles: scoredResults as Article[]
    };

  } catch (error) {
    console.error('Search failed:', error);
    throw new Error('Failed to load articles');
  }
}

// Extract meaningful search terms
const extractSearchTerms = (query: string) => {
  // Remove common words and extract meaningful terms
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'why', 'when', 'where', 'who']);
  
  const words = query.split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .map(word => word.replace(/[^\w]/g, '')); // Remove punctuation
  
  return words;
};

// Search for exact matches in title, summary, and content
const searchExactMatches = async (searchTerms: string[]) => {
  if (searchTerms.length === 0) return [];
  
  const searchConditions = searchTerms.map(term => 
    `title.ilike.%${term}%,summary.ilike.%${term}%`
  ).join(',');
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .or(searchConditions)
    .limit(50);
  
  if (error) {
    console.error('Exact search error:', error);
    return [];
  }
  
  return data || [];
};

// Search for related content in content_blocks
const searchRelatedContent = async (searchTerms: string[]) => {
  if (searchTerms.length === 0) return [];
  
  // Get all articles and search content_blocks client-side
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .limit(100);
  
  if (error || !data) return [];
  
  // Search in content_blocks for each article
  const matches = data.filter(article => {
    if (!article.content_blocks) return false;
    
    const contentText = JSON.stringify(article.content_blocks).toLowerCase();
    return searchTerms.some(term => contentText.includes(term));
  });
  
  return matches;
};

// Search by category relevance
const searchByCategory = async (query: string) => {
  const categoryKeywords = {
    'mental_health': ['depression', 'anxiety', 'ptsd', 'adhd', 'ocd', 'bipolar', 'schizophrenia', 'mood', 'mental', 'psychiatric'],
    'neuroscience': ['brain', 'neuron', 'synapse', 'neurotransmitter', 'neuroplasticity', 'neural', 'cognitive', 'memory'],
    'psychology': ['behavior', 'cognitive', 'personality', 'developmental', 'social', 'learning', 'motivation'],
    'brain_health': ['sleep', 'nutrition', 'exercise', 'cognitive training', 'brain health', 'wellness'],
    'neurodiversity': ['autism', 'adhd', 'dyslexia', 'dyspraxia', 'neurodivergent', 'neurodiversity'],
    'interventions': ['therapy', 'medication', 'treatment', 'cbt', 'mindfulness', 'meditation', 'intervention'],
    'lifestyle_factors': ['diet', 'exercise', 'sleep', 'social', 'lifestyle', 'environment'],
    'lab_testing': ['test', 'assessment', 'diagnosis', 'biomarker', 'imaging', 'evaluation']
  };
  
  const relevantCategories = Object.entries(categoryKeywords)
    .filter(([category, keywords]) => 
      keywords.some(keyword => query.includes(keyword))
    )
    .map(([category]) => category);
  
  if (relevantCategories.length === 0) return [];
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .in('category', relevantCategories)
    .limit(30);
  
  if (error) {
    console.error('Category search error:', error);
    return [];
  }
  
  return data || [];
};

// Deduplicate articles by ID
const deduplicateArticles = (articles: any[]) => {
  const seen = new Set();
  return articles.filter(article => {
    if (seen.has(article.id)) return false;
    seen.add(article.id);
    return true;
  });
};

// Advanced scoring system
const scoreArticles = (articles: any[], query: string, searchTerms: string[]) => {
  return articles.map(article => {
    let score = 0;
    const title = article.title.toLowerCase();
    const summary = article.summary.toLowerCase();
    const tags = article.tags || [];
    const contentBlocks = article.content_blocks || {};
    
    // 1. Exact phrase matches (highest priority)
    if (title.includes(query)) score += 200;
    if (summary.includes(query)) score += 100;
    
    // 2. Title word matches
    const titleWords = title.split(/\s+/);
    searchTerms.forEach(term => {
      if (titleWords.includes(term)) score += 50;
      if (titleWords.some((word: string) => word.includes(term))) score += 30;
    });
    
    // 3. Summary word matches
    const summaryWords = summary.split(/\s+/);
    searchTerms.forEach(term => {
      if (summaryWords.includes(term)) score += 25;
      if (summaryWords.some((word: string) => word.includes(term))) score += 15;
    });
    
    // 4. Content blocks search
    const contentText = JSON.stringify(contentBlocks).toLowerCase();
    searchTerms.forEach(term => {
      if (contentText.includes(term)) score += 20;
    });
    
    // 5. Tag relevance
    tags.forEach((tag: string) => {
      const tagLower = tag.toLowerCase();
      if (query.includes(tagLower) || tagLower.includes(query)) score += 40;
      searchTerms.forEach(term => {
        if (tagLower.includes(term) || term.includes(tagLower)) score += 20;
      });
    });
    
    // 6. Content quality indicators
    if (summary.length > 200) score += 5;
    if (Object.keys(contentBlocks).length > 5) score += 5;
    
    // 7. Recency bonus
    const daysSinceUpdate = (Date.now() - new Date(article.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) score += 3;
    if (daysSinceUpdate < 7) score += 2;
    
    // 8. Synonym matching (basic)
    const synonyms = getSynonyms(query);
    synonyms.forEach(synonym => {
      if (title.includes(synonym) || summary.includes(synonym)) score += 15;
    });
    
    return { article, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(item => item.article);
};

// Basic synonym matching
const getSynonyms = (query: string) => {
  const synonymMap: { [key: string]: string[] } = {
    'depression': ['mood disorder', 'major depressive disorder', 'mdd', 'clinical depression'],
    'anxiety': ['anxiety disorder', 'generalized anxiety', 'gad', 'worry'],
    'adhd': ['attention deficit', 'hyperactivity', 'attention disorder'],
    'ptsd': ['post traumatic stress', 'trauma', 'traumatic stress'],
    'therapy': ['treatment', 'intervention', 'psychotherapy', 'counseling'],
    'medication': ['drug', 'pharmaceutical', 'medicine', 'treatment'],
    'brain': ['neural', 'cognitive', 'neurological', 'mental'],
    'sleep': ['rest', 'slumber', 'sleep quality', 'sleep hygiene'],
    'exercise': ['physical activity', 'workout', 'fitness', 'training'],
    'nutrition': ['diet', 'food', 'eating', 'nutritional'],
    'mindfulness': ['meditation', 'awareness', 'present moment', 'mindful'],
    'cbt': ['cognitive behavioral therapy', 'cognitive therapy', 'behavioral therapy']
  };
  
  return synonymMap[query] || [];
};

function generateSimpleAnswer(articles: Article[], query: string): string {
  if (articles.length === 0) {
    return `I couldn't find any articles related to "${query}". Try searching for different terms or browse our categories.`;
  }

  const topArticle = articles[0];
  const category = topArticle.category?.replace('_', ' ') || 'mental health';
  
  return `I found ${articles.length} article${articles.length > 1 ? 's' : ''} related to "${query}". The most relevant is "${topArticle.title}" in the ${category} category. You can browse all results below or try a more specific search term.`;
} 