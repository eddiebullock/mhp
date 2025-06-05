import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

// Debug environment variables
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

type ArticleCategory = 'mental_health' | 'neuroscience' | 'psychology' | 'brain_health' | 
                      'neurodiversity' | 'interventions' | 'lifestyle_factors' | 'lab_testing';

interface BaseArticle {
  title: string;
  slug: string;
  summary: string;
  category: ArticleCategory;
  overview: string;
  future_directions: string;
  references_and_resources: string;
  status: 'published' | 'draft' | 'archived';
  tags: string[];
}

interface MentalHealthArticle extends BaseArticle {
  category: 'mental_health';
  prevalence: string;
  causes_and_mechanisms: string;
  symptoms_and_impact: string;
  evidence_summary: string;
  practical_takeaways: string;
  common_myths: string;
}

interface NeuroscienceArticle extends BaseArticle {
  category: 'neuroscience' | 'psychology' | 'brain_health';
  definition: string;
  mechanisms: string;
  relevance: string;
  key_studies: string;
  common_misconceptions: string;
  practical_implications: string;
}

interface PsychologyArticle extends BaseArticle {
  category: 'psychology';
  definition: string;
  core_principles: string;
  relevance: string;
  key_studies_and_theories: string;
  common_misconceptions: string;
  practical_applications: string;
}

interface NeurodiversityArticle extends BaseArticle {
  category: 'neurodiversity';
  neurodiversity_perspective: string;
  common_strengths_and_challenges: string;
  prevalence_and_demographics: string;
  mechanisms_and_understanding: string;
  evidence_summary: string;
  common_misconceptions: string;
  practical_takeaways: string;
  lived_experience: string;
}

interface InterventionArticle extends BaseArticle {
  category: 'interventions' | 'lifestyle_factors';
  how_it_works: string;
  evidence_base: string;
  effectiveness: string;
  practical_applications: string;
  common_myths: string;
  risks_and_limitations: string;
}

interface LabTestingArticle extends BaseArticle {
  category: 'lab_testing';
  how_it_works: string;
  applications: string;
  strengths_and_limitations: string;
  risks_and_limitations: string;
}

type Article = MentalHealthArticle | NeuroscienceArticle | PsychologyArticle | 
              NeurodiversityArticle | InterventionArticle | LabTestingArticle;

// Validate article data
function validateArticle(article: any): article is Article {
  const requiredBaseFields = ['title', 'slug', 'summary', 'category', 'overview', 'status', 'tags'];
  const hasAllBaseFields = requiredBaseFields.every(field => field in article);
  
  if (!hasAllBaseFields) {
    console.error(`Missing required base fields in article: ${article.title}`);
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

  // Validate category-specific fields
  switch (article.category) {
    case 'mental_health':
      const mentalHealthFields = ['prevalence', 'causes_and_mechanisms', 'symptoms_and_impact', 
                                'evidence_summary', 'practical_takeaways', 'common_myths'];
      return mentalHealthFields.every(field => field in article);

    case 'neuroscience':
    case 'brain_health':
      const neuroscienceFields = ['definition', 'mechanisms', 'relevance', 'key_studies', 
                                'common_misconceptions', 'practical_implications'];
      return neuroscienceFields.every(field => field in article);

    case 'psychology':
      const psychologyFields = ['definition', 'core_principles', 'relevance', 
                              'key_studies_and_theories', 'common_misconceptions', 
                              'practical_applications'];
      return psychologyFields.every(field => field in article);

    case 'neurodiversity':
      const neurodiversityFields = ['neurodiversity_perspective', 'common_strengths_and_challenges',
                                  'prevalence_and_demographics', 'mechanisms_and_understanding',
                                  'evidence_summary', 'common_misconceptions', 'practical_takeaways',
                                  'lived_experience'];
      return neurodiversityFields.every(field => field in article);

    case 'interventions':
      const interventionFields = ['how_it_works', 'evidence_base', 'effectiveness', 
                                'practical_applications', 'common_myths', 'risks_and_limitations'];
      return interventionFields.every(field => field in article);

    case 'lifestyle_factors':
      const lifestyleFields = ['mechanisms', 'evidence_summary', 'practical_takeaways', 
                             'risks_and_limitations', 'future_directions'];
      return lifestyleFields.every(field => field in article);

    case 'lab_testing':
      const labTestingFields = ['how_it_works', 'applications', 'strengths_and_limitations', 
                               'risks_and_limitations', 'future_directions'];
      return labTestingFields.every(field => field in article);

    default:
      console.error(`Invalid category for article: ${article.title}`);
      return false;
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file');
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
            ...Object.fromEntries(
              Object.entries(article).filter(([key]) => key !== 'lived_experience')
            ),
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