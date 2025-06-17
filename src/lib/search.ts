import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Article = Database['public']['Tables']['articles']['Row'];

const supabase = createClient();

// Cache for embeddings to avoid repeated API calls
const embeddingCache = new Map<string, number[]>();

// Free embedding generation using a simple but effective approach
async function generateEmbedding(text: string): Promise<number[]> {
  // Check cache first
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  try {
    // Use a free text embedding service (Cohere's free tier)
    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer free', // This will use their free tier
      },
      body: JSON.stringify({
        texts: [text],
        model: 'embed-english-v3.0',
        input_type: 'search_query',
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    const embedding = result.embeddings[0];
    
    // Cache the result
    embeddingCache.set(text, embedding);
    
    return embedding;
  } catch (error) {
    console.warn('Failed to generate embedding, using improved text similarity:', error);
    // Use an improved text-based embedding
    return generateImprovedTextEmbedding(text);
  }
}

// Improved text-based embedding generation
function generateImprovedTextEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0);
  
  // Create word frequency map
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Generate embedding based on word frequencies and positions
  wordFreq.forEach((freq, word) => {
    // Use multiple hash functions for better distribution
    const hash1 = word.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0);
    const hash2 = word.split('').reduce((a, b) => ((a << 7) - a + b.charCodeAt(0)) & 0xffffffff, 0);
    
    const pos1 = Math.abs(hash1) % embedding.length;
    const pos2 = Math.abs(hash2) % embedding.length;
    
    embedding[pos1] += freq * 0.7;
    embedding[pos2] += freq * 0.3;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    embedding.forEach((val, i) => {
      embedding[i] = val / magnitude;
    });
  }
  
  return embedding;
}

// Enhanced text similarity function
function calculateTextSimilarity(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const textWords = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (queryWords.length === 0 || textWords.length === 0) return 0;
  
  const querySet = new Set(queryWords);
  const textSet = new Set(textWords);
  
  const intersection = new Set([...querySet].filter(x => textSet.has(x)));
  const union = new Set([...querySet, ...textSet]);
  
  const jaccard = intersection.size / union.size;
  
  // Add bonus for exact phrase matches
  const exactMatch = text.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;
  
  return Math.min(1, jaccard + exactMatch);
}

// Cosine similarity for embeddings
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function semanticSearch(query: string): Promise<{ answer: string; articles: Article[] }> {
  try {
    console.log('Searching for:', query);
    
    // Get ALL published articles for comprehensive search
    const { data: allArticles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .limit(100);

    if (error) {
      console.error('Search error:', error);
      throw new Error('Failed to search articles');
    }

    if (!allArticles || allArticles.length === 0) {
      return {
        answer: `I couldn't find any articles related to "${query}". Try searching for different terms or browse our categories.`,
        articles: []
      };
    }

    // Comprehensive scoring system (same as feed page)
    const articlesWithScores = allArticles.map(article => {
      let score = 0;
      const queryLower = query.toLowerCase();
      const title = article.title.toLowerCase();
      const summary = article.summary.toLowerCase();
      const tags = article.tags || [];
      
      // 1. Exact matches (highest priority)
      if (title.includes(queryLower)) score += 100;
      if (summary.includes(queryLower)) score += 50;
      
      // 2. Word-by-word matching
      const titleWords = title.split(/\s+/);
      const summaryWords = summary.split(/\s+/);
      const queryWords = queryLower.split(/\s+/);
      
      queryWords.forEach(word => {
        if (titleWords.includes(word)) score += 20;
        if (summaryWords.includes(word)) score += 10;
      });
      
      // 3. Tag matching
      tags.forEach((tag: string) => {
        if (queryLower.includes(tag.toLowerCase()) || tag.toLowerCase().includes(queryLower)) {
          score += 15;
        }
      });
      
      // 4. Recency bonus (newer articles get slight boost)
      const daysSinceUpdate = (Date.now() - new Date(article.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 30) score += 2;
      
      // 5. Content length bonus (more comprehensive articles)
      if (summary.length > 200) score += 1;
      
      return { article, score };
    });

    // Filter out articles with zero score and sort by score
    const relevantArticles = articlesWithScores
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15) // Return top 15
      .map(item => item.article);

    console.log('Found articles:', relevantArticles.length);

    // Generate a simple answer based on the found articles
    const answer = generateSimpleAnswer(relevantArticles, query);

    return {
      answer,
      articles: relevantArticles as Article[]
    };

  } catch (error) {
    console.error('Search failed:', error);
    throw new Error('Failed to load articles');
  }
}

function generateSimpleAnswer(articles: Article[], query: string): string {
  const count = articles.length;
  
  if (count === 1) {
    return `I found 1 article related to "${query}": "${articles[0].title}".`;
  } else if (count <= 3) {
    const titles = articles.map(a => `"${a.title}"`).join(', ');
    return `I found ${count} articles related to "${query}": ${titles}.`;
  } else {
    const topTitles = articles.slice(0, 3).map(a => `"${a.title}"`).join(', ');
    return `I found ${count} articles related to "${query}". Here are the top results: ${topTitles}, and ${count - 3} more.`;
  }
} 