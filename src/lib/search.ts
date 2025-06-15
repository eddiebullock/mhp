import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { pipeline } from '@xenova/transformers';

type Article = Database['public']['Tables']['articles']['Row'];

// Initialize the embedding model only for query embedding
let embeddingPipeline: any = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingPipeline;
}

async function getQueryEmbedding(text: string): Promise<number[]> {
  const pipeline = await getEmbeddingPipeline();
  const output = await pipeline(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

function parseEmbedding(embedding: any): number[] {
  if (!embedding) return [];
  
  // If it's a string (JSON), parse it
  if (typeof embedding === 'string') {
    try {
      return JSON.parse(embedding);
    } catch (e) {
      console.error('Failed to parse embedding JSON:', e);
      return [];
    }
  }
  
  // If it's already an array, return it
  if (Array.isArray(embedding)) {
    return embedding;
  }
  
  // If it's an object with a data property (common format from some DBs)
  if (embedding && typeof embedding === 'object' && 'data' in embedding) {
    return Array.isArray(embedding.data) ? embedding.data : [];
  }
  
  console.error('Unexpected embedding format:', embedding);
  return [];
}

function cosineSimilarity(a: number[], b: any): number {
  // Parse the second embedding if needed
  const bArray = parseEmbedding(b);
  
  // Validate inputs
  if (!Array.isArray(a) || !Array.isArray(bArray) || a.length === 0 || bArray.length === 0) {
    console.warn('Invalid embeddings for similarity calculation:', { a, b });
    return 0;
  }
  
  // Ensure both arrays are the same length
  const length = Math.min(a.length, bArray.length);
  if (length === 0) return 0;
  
  const dotProduct = a.slice(0, length).reduce((sum, val, i) => sum + val * bArray[i], 0);
  const magnitudeA = Math.sqrt(a.slice(0, length).reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(bArray.slice(0, length).reduce((sum, val) => sum + val * val, 0));
  
  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}

function preprocessQuery(query: string): string {
  // Convert to lowercase and remove punctuation
  let processed = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
  
  // Expand common sleep-related terms with more comprehensive mappings
  const termMap: { [key: string]: string[] } = {
    'sleep': ['insomnia', 'rest', 'bedtime', 'night', 'tired', 'fatigue', 'sleeping', 'sleepless', 'sleepiness', 'sleep quality', 'sleep hygiene'],
    'mind': ['thoughts', 'thinking', 'brain', 'mental', 'cognitive', 'mindfulness', 'consciousness', 'mental state'],
    'race': ['racing', 'fast', 'quick', 'rapid', 'overactive', 'hyperactive', 'busy', 'active', 'restless'],
    'struggle': ['difficulty', 'trouble', 'problem', 'issue', 'hard', 'challenge', 'difficult', 'troubled'],
    'moment': ['now', 'currently', 'present', 'recently', 'lately', 'these days', 'at present'],
    'because': ['due to', 'as a result of', 'caused by', 'resulting from', 'stemming from']
  };

  // Add related terms to the query
  Object.entries(termMap).forEach(([term, related]) => {
    if (processed.includes(term)) {
      processed += ' ' + related.join(' ');
    }
  });

  return processed;
}

function isSleepRelatedContent(text: string): boolean {
  const sleepTerms = [
    'sleep', 'insomnia', 'bedtime', 'night', 'tired', 'fatigue',
    'sleeping', 'sleepless', 'sleepiness', 'sleep quality', 'sleep hygiene',
    'circadian', 'rest', 'nap', 'dream', 'awake', 'wake'
  ];
  const textLower = text.toLowerCase();
  return sleepTerms.some(term => textLower.includes(term));
}

function isRacingThoughtsContent(text: string): boolean {
  const thoughtTerms = [
    'thought', 'mind', 'mental', 'racing', 'busy', 'active',
    'overactive', 'hyperactive', 'restless', 'worry', 'anxiety',
    'stress', 'rumination', 'thinking', 'cognitive'
  ];
  const textLower = text.toLowerCase();
  return thoughtTerms.some(term => textLower.includes(term));
}

function extractRelevantContent(article: Article, query: string): string[] {
  const relevantContent: string[] = [];
  const processedQuery = preprocessQuery(query);
  const isSleepQuery = processedQuery.includes('sleep') || 
                      processedQuery.includes('insomnia') || 
                      processedQuery.includes('tired') || 
                      processedQuery.includes('rest');
  const isRacingThoughtsQuery = processedQuery.includes('race') || 
                               processedQuery.includes('mind') || 
                               processedQuery.includes('thought');
  
  // For sleep-related queries, be very strict about content relevance
  if (isSleepQuery) {
    // First, check if the article is actually about sleep
    const articleText = (article.title + ' ' + article.summary + ' ' + 
                        JSON.stringify(article.content_blocks)).toLowerCase();
    if (!isSleepRelatedContent(articleText)) {
      return []; // Skip articles that aren't primarily about sleep
    }

    // For sleep queries, prioritize in this order:
    // 1. Practical advice and solutions
    // 2. Symptoms and impact
    // 3. How it works/mechanisms
    // 4. Overview and summary
    
    // Check category-specific content blocks first
    if (article.category === 'brain_health') {
      // For brain health articles, prioritize sleep-specific content
      if (article.content_blocks?.practical_takeaways && 
          isSleepRelatedContent(article.content_blocks.practical_takeaways)) {
        relevantContent.push(article.content_blocks.practical_takeaways);
      }
      if (article.content_blocks?.practical_applications && 
          isSleepRelatedContent(article.content_blocks.practical_applications)) {
        relevantContent.push(article.content_blocks.practical_applications);
      }
      if (article.content_blocks?.symptoms_and_impact && 
          (isSleepRelatedContent(article.content_blocks.symptoms_and_impact) || 
           (isRacingThoughtsQuery && isRacingThoughtsContent(article.content_blocks.symptoms_and_impact)))) {
        relevantContent.push(article.content_blocks.symptoms_and_impact);
      }
      if (article.content_blocks?.how_it_works && 
          isSleepRelatedContent(article.content_blocks.how_it_works)) {
        relevantContent.push(article.content_blocks.how_it_works);
      }
    } else if (article.category === 'interventions') {
      // For intervention articles, only include sleep-specific interventions
      if (article.content_blocks?.practical_applications && 
          isSleepRelatedContent(article.content_blocks.practical_applications)) {
        relevantContent.push(article.content_blocks.practical_applications);
      }
      if (article.content_blocks?.how_it_works && 
          isSleepRelatedContent(article.content_blocks.how_it_works)) {
        relevantContent.push(article.content_blocks.how_it_works);
      }
    }

    // Only add overview and summary if they're sleep-related
    if (article.content_blocks?.overview && 
        isSleepRelatedContent(article.content_blocks.overview)) {
      relevantContent.push(article.content_blocks.overview);
    }
    if (article.summary && isSleepRelatedContent(article.summary)) {
      relevantContent.push(article.summary);
    }
    
    return relevantContent;
  }

  // Add category-specific content based on the query
  if (processedQuery.includes('how') || processedQuery.includes('what') || processedQuery.includes('mechanism')) {
    if (article.content_blocks?.mechanisms) relevantContent.push(article.content_blocks.mechanisms);
    if (article.content_blocks?.how_it_works) relevantContent.push(article.content_blocks.how_it_works);
  }
  
  if (processedQuery.includes('symptom') || processedQuery.includes('sign') || processedQuery.includes('experience') || processedQuery.includes('struggle')) {
    if (article.content_blocks?.symptoms_and_impact) relevantContent.push(article.content_blocks.symptoms_and_impact);
  }
  
  if (processedQuery.includes('evidence') || processedQuery.includes('research') || processedQuery.includes('study')) {
    if (article.content_blocks?.evidence_summary) relevantContent.push(article.content_blocks.evidence_summary);
    if (article.content_blocks?.key_studies) relevantContent.push(article.content_blocks.key_studies);
  }
  
  if (processedQuery.includes('help') || processedQuery.includes('treatment') || processedQuery.includes('solution')) {
    if (article.content_blocks?.practical_takeaways) relevantContent.push(article.content_blocks.practical_takeaways);
    if (article.content_blocks?.practical_applications) relevantContent.push(article.content_blocks.practical_applications);
  }

  return relevantContent;
}

function generateAnswer(articles: Article[], query: string): string {
  const processedQuery = preprocessQuery(query);
  const isSleepQuery = processedQuery.includes('sleep') || 
                      processedQuery.includes('insomnia') || 
                      processedQuery.includes('tired');
  const isRacingThoughtsQuery = processedQuery.includes('race') || 
                               processedQuery.includes('mind') || 
                               processedQuery.includes('thought');

  // Sort articles by relevance and category
  const relevantArticles = articles
    .map(article => ({
      article,
      content: extractRelevantContent(article, query),
      // Prioritize articles with practical advice for sleep and racing thoughts
      categoryScore: isSleepQuery ? 
        (article.category === 'brain_health' ? 3 : 
         article.category === 'interventions' ? 2 : 
         article.category === 'mental_health' ? 1.5 : 1) : 1
    }))
    .filter(({ content }) => content.length > 0)
    .sort((a, b) => b.categoryScore - a.categoryScore);

  if (relevantArticles.length === 0) {
    return "I couldn't find any specific information about sleep issues in our database. Please try rephrasing your query or ask about a different topic.";
  }

  // Generate a conversational answer
  let answer = "";
  
  if (isSleepQuery) {
    answer = "Based on our research about sleep and mental health, ";
    
    // Group content by type and ensure it's sleep-related
    const practicalContent = relevantArticles
      .flatMap(({ content }) => content)
      .filter(content => 
        isSleepRelatedContent(content) &&
        (content.toLowerCase().includes('practical') || 
         content.toLowerCase().includes('takeaway') ||
         content.toLowerCase().includes('recommendation') ||
         content.toLowerCase().includes('solution') ||
         content.toLowerCase().includes('help') ||
         content.toLowerCase().includes('tip') ||
         content.toLowerCase().includes('strategy') ||
         content.toLowerCase().includes('technique') ||
         content.toLowerCase().includes('practice'))
      );

    const racingThoughtsContent = relevantArticles
      .flatMap(({ content }) => content)
      .filter(content => 
        isRacingThoughtsContent(content) && 
        isSleepRelatedContent(content) &&
        (content.toLowerCase().includes('thought') || 
         content.toLowerCase().includes('mind') ||
         content.toLowerCase().includes('mental') ||
         content.toLowerCase().includes('racing') ||
         content.toLowerCase().includes('busy') ||
         content.toLowerCase().includes('active'))
      );

    const mechanismContent = relevantArticles
      .flatMap(({ content }) => content)
      .filter(content => 
        isSleepRelatedContent(content) &&
        (content.toLowerCase().includes('how it works') || 
         content.toLowerCase().includes('mechanism') ||
         content.toLowerCase().includes('process') ||
         content.toLowerCase().includes('explain') ||
         content.toLowerCase().includes('understand'))
      );

    // Build a structured answer focusing on practical advice first
    if (practicalContent.length > 0) {
      // Extract and format practical advice
      const practicalAdvice = practicalContent
        .map(content => {
          // Extract bullet points or numbered items
          const bulletPoints = content.match(/- [^.\n]+\./g) || 
                             content.match(/\d+\. [^.\n]+\./g) ||
                             [content];
          return bulletPoints.map(point => point.trim()).join(' ');
        })
        .join(' ');

      answer += "Here are some practical strategies that may help: " + practicalAdvice + "\n\n";
    }

    // Add specific advice for racing thoughts if present
    if (isRacingThoughtsQuery && racingThoughtsContent.length > 0) {
      // Extract practical advice about racing thoughts
      const racingThoughtsAdvice = racingThoughtsContent
        .filter(content => 
          content.toLowerCase().includes('practical') || 
          content.toLowerCase().includes('takeaway') ||
          content.toLowerCase().includes('recommendation') ||
          content.toLowerCase().includes('solution') ||
          content.toLowerCase().includes('help') ||
          content.toLowerCase().includes('tip') ||
          content.toLowerCase().includes('strategy')
        );

      if (racingThoughtsAdvice.length > 0) {
        answer += "Regarding racing thoughts specifically, here are some helpful strategies: " + 
                 racingThoughtsAdvice[0].toLowerCase() + "\n\n";
      } else {
        // If no specific advice found, explain the connection
        answer += "Regarding racing thoughts, this is a common experience that can make it difficult to fall asleep. " +
                 "It's often related to increased mental activity before sleep, which can be managed through " +
                 "relaxation techniques, establishing a calming bedtime routine, and practicing mindfulness. " +
                 "If racing thoughts persist, it may be helpful to write them down before bed or try " +
                 "progressive muscle relaxation techniques.\n\n";
      }
    }

    // Add brief explanation of the mechanism if available
    if (mechanismContent.length > 0) {
      const briefMechanism = mechanismContent[0]
        .split('.')
        .slice(0, 2) // Take first two sentences
        .join('.');
      answer += "To better understand this: " + briefMechanism.toLowerCase();
    }

    // Add a note about sleep hygiene if not already mentioned
    if (!answer.toLowerCase().includes('sleep hygiene')) {
      answer += "\n\nRemember that good sleep hygiene is essential: maintain a consistent sleep schedule, " +
                "create a comfortable sleep environment, limit screen time before bed, and practice " +
                "relaxation techniques. These practices can help manage both sleep difficulties and racing thoughts.";
    }
  } else {
    // Default answer generation for other queries
    answer = "Based on our research and content, ";
    const mainArticle = relevantArticles[0];
    if (mainArticle.content[0]) {
      answer += mainArticle.content[0].toLowerCase();
    }
  }

  // Add a note about consulting professionals
  answer += "\n\nPlease note that while this information is based on research and expert knowledge, it's always best to consult with healthcare professionals for personalized advice.";

  return answer;
}

export async function semanticSearch(query: string): Promise<{ answer: string; articles: Article[] }> {
  try {
    console.log('Starting semantic search for query:', query);
    const processedQuery = preprocessQuery(query);
    console.log('Processed query:', processedQuery);
    
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get query embedding
    console.log('Getting query embedding...');
    const queryEmbedding = await getQueryEmbedding(processedQuery);
    console.log('Query embedding generated, length:', queryEmbedding.length);

    // Get all published articles with their embeddings
    console.log('Fetching articles from database...');
    const { data: articles, error } = await supabase
      .from('articles')
      .select('*, title_embedding, content_embedding, summary_embedding')
      .eq('status', 'published');

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch articles from the database');
    }

    if (!articles || articles.length === 0) {
      console.error('No articles found in database');
      throw new Error('No articles found in the database');
    }

    console.log(`Found ${articles.length} articles`);

    // Calculate similarity scores using the pre-computed embeddings
    const articlesWithScores = articles.map(article => {
      // Parse and validate embeddings
      const titleEmbedding = parseEmbedding(article.title_embedding);
      const contentEmbedding = parseEmbedding(article.content_embedding);
      const summaryEmbedding = parseEmbedding(article.summary_embedding);
      
      // Calculate similarities
      const titleSimilarity = titleEmbedding.length > 0 ? cosineSimilarity(queryEmbedding, titleEmbedding) : 0;
      const contentSimilarity = contentEmbedding.length > 0 ? cosineSimilarity(queryEmbedding, contentEmbedding) : 0;
      const summarySimilarity = summaryEmbedding.length > 0 ? cosineSimilarity(queryEmbedding, summaryEmbedding) : 0;

      // For sleep-related queries, adjust weights and boost scores
      const isSleepQuery = processedQuery.includes('sleep') || 
                          processedQuery.includes('insomnia') || 
                          processedQuery.includes('tired');
      const isRacingThoughtsQuery = processedQuery.includes('race') || 
                                   processedQuery.includes('mind') || 
                                   processedQuery.includes('thought');
      
      // Adjust weights based on category for sleep queries
      let weights = { title: 0.3, summary: 0.3, content: 0.4 };
      if (isSleepQuery) {
        if (article.category === 'brain_health') {
          weights = { title: 0.2, summary: 0.2, content: 0.6 }; // Much more weight on content
        } else if (article.category === 'interventions') {
          weights = { title: 0.25, summary: 0.25, content: 0.5 }; // More weight on content
        }
      }

      let similarity = (titleSimilarity * weights.title) + 
                      (summarySimilarity * weights.summary) + 
                      (contentSimilarity * weights.content);

      // Boost similarity for articles that explicitly mention sleep or racing thoughts
      if (isSleepQuery) {
        const articleText = (article.title + ' ' + article.summary + ' ' + 
                           JSON.stringify(article.content_blocks)).toLowerCase();
        
        // Strong boost for sleep-related content
        if (isSleepRelatedContent(articleText)) {
          similarity *= 2.0; // Double the similarity for sleep-related content
        }
        
        // Additional boost for racing thoughts
        if (isRacingThoughtsQuery && isRacingThoughtsContent(articleText)) {
          similarity *= 1.5;
        }
        
        // Category boost
        if (article.category === 'brain_health') {
          similarity *= 2.0; // Double the similarity for brain_health category
        } else if (article.category === 'interventions') {
          similarity *= 1.5;
        }
      }

      return { article, similarity };
    });

    // Sort articles by similarity score
    const sortedArticles = articlesWithScores.sort((a, b) => b.similarity - a.similarity);
    console.log('Top 3 article similarities:', sortedArticles.slice(0, 3).map(a => ({
      title: a.article.title,
      category: a.article.category,
      similarity: a.similarity,
      isSleepRelated: isSleepRelatedContent(a.article.title + ' ' + a.article.summary)
    })));

    // Use a higher threshold for sleep-related queries to ensure relevance
    const isSleepQuery = processedQuery.includes('sleep') || 
                        processedQuery.includes('insomnia') || 
                        processedQuery.includes('tired');
    const threshold = isSleepQuery ? 0.2 : 0.15; // Higher threshold for sleep queries

    const relevantArticles = sortedArticles
      .filter(({ similarity, article }) => {
        // For sleep queries, only include articles that are actually about sleep
        if (isSleepQuery) {
          const articleText = article.title + ' ' + article.summary;
          return similarity > threshold && isSleepRelatedContent(articleText);
        }
        return similarity > threshold;
      })
      .map(({ article }) => article);

    console.log(`Found ${relevantArticles.length} relevant articles above threshold ${threshold}`);

    if (relevantArticles.length === 0) {
      console.log('No articles met threshold, using fallback articles');
      // If no articles meet the similarity threshold, return the top 3 most similar articles that are actually about sleep
      const fallbackArticles = sortedArticles
        .filter(({ article }) => {
          const articleText = article.title + ' ' + article.summary;
          return isSleepQuery ? isSleepRelatedContent(articleText) : true;
        })
        .slice(0, 3)
        .map(({ article }) => article);

      const answer = generateAnswer(fallbackArticles, query);
      return {
        answer,
        articles: fallbackArticles
      };
    }

    // Generate answer using the most relevant articles
    const answer = generateAnswer(relevantArticles, query);
    console.log('Generated answer successfully');

    return {
      answer,
      articles: relevantArticles.slice(0, 5) // Return top 5 most relevant articles
    };
  } catch (error) {
    console.error('Semantic search error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch articles')) {
        throw new Error('Unable to access our article database. Please try again in a few moments.');
      } else if (error.message.includes('No articles found')) {
        throw new Error('We couldn\'t find any relevant articles. Please try a different search term.');
      }
    }
    throw new Error('We\'re having trouble processing your question. Please try rephrasing it or use more specific terms.');
  }
} 