import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Article {
  title: string;
  slug: string;
  summary: string;
  category_id: string;
  content: {
    overview: string;
    mechanisms: string;
    safety: string;
    faqs: Array<{ question: string; answer: string }>;
    keyEvidence: string;
    practicalTakeaways: string;
  };
  tags: string[];
  status: 'published' | 'draft' | 'archived';
}

// Validate article data
function validateArticle(article: any): article is Article {
  const requiredFields = ['title', 'slug', 'summary', 'category_id', 'content', 'tags', 'status'];
  const hasAllFields = requiredFields.every(field => field in article);
  
  if (!hasAllFields) {
    console.error(`Missing required fields in article: ${article.title}`);
    return false;
  }

  if (!['published', 'draft', 'archived'].includes(article.status)) {
    console.error(`Invalid status for article: ${article.title}`);
    return false;
  }

  if (!Array.isArray(article.tags)) {
    console.error(`Tags must be an array for article: ${article.title}`);
    return false;
  }

  const contentFields = ['overview', 'mechanisms', 'safety', 'faqs', 'keyEvidence', 'practicalTakeaways'];
  const hasAllContentFields = contentFields.every(field => field in article.content);
  
  if (!hasAllContentFields) {
    console.error(`Missing required content fields in article: ${article.title}`);
    return false;
  }

  return true;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Load and parse JSON data
    const filePath = path.join(__dirname, 'articles-data.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const articles = JSON.parse(rawData);

    if (!Array.isArray(articles)) {
      throw new Error('Articles data must be an array');
    }

    console.log(`Found ${articles.length} articles to process`);

    // Process articles in batches
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < articles.length; i += batchSize) {
      batches.push(articles.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;

    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);

      for (const article of batch) {
        if (!validateArticle(article)) {
          errorCount++;
          continue;
        }

        try {
          const { error } = await supabase.from('articles').insert({
            id: uuidv4(),
            title: article.title,
            slug: article.slug,
            summary: article.summary,
            category_id: article.category_id,
            content: article.content,
            tags: article.tags,
            status: article.status,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (error) {
            console.error(`Error inserting article "${article.title}":`, error.message);
            errorCount++;
          } else {
            console.log(`Successfully inserted: ${article.title}`);
            successCount++;
          }
        } catch (error) {
          console.error(`Unexpected error for article "${article.title}":`, error);
          errorCount++;
        }
      }

      // Add a small delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\nUpload Summary:');
    console.log(`Total articles: ${articles.length}`);
    console.log(`Successfully uploaded: ${successCount}`);
    console.log(`Failed: ${errorCount}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(console.error); 