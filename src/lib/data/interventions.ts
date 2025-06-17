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

// Map frontend categories to database categories
const categoryMap = {
  lifestyle: 'lifestyle_factors' as ArticleCategory,
  clinical: 'interventions' as ArticleCategory,
  risk_factor: 'mental_health' as ArticleCategory, // We'll filter these by tags
};

export async function getInterventions(category: keyof typeof categoryMap) {
  const dbCategory = categoryMap[category];
  
  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  // For risk factors, we need to filter by tags
  if (category === 'risk_factor') {
    query = query
      .eq('category', dbCategory)
      .contains('tags', ['risk_factor']);
  } else {
    query = query.eq('category', dbCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching interventions:', error);
    throw error;
  }

  // Transform the data to match our Intervention type
  return data.map((article): Intervention => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    evidenceStrength: article.content_blocks?.evidence_summary?.toLowerCase().includes('strong') 
      ? 'Strong' 
      : article.content_blocks?.evidence_summary?.toLowerCase().includes('moderate')
      ? 'Moderate'
      : article.content_blocks?.evidence_summary?.toLowerCase().includes('limited')
      ? 'Limited'
      : 'Insufficient',
    studyCount: article.content_blocks?.key_studies?.split('\n').length || 0,
    reliabilityRating: article.content_blocks?.reliability_score || 3,
    conditions: article.tags || [],
    summary: article.summary || '',
    content: article.content_blocks,
    tags: article.tags || [],
    status: article.status,
  }));
}

export async function getInterventionsByCondition(
  category: keyof typeof categoryMap,
  condition: string
) {
  const dbCategory = categoryMap[category];
  
  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .contains('tags', [condition])
    .order('created_at', { ascending: false });

  // For risk factors, we need to filter by both category and risk factor tag
  if (category === 'risk_factor') {
    query = query
      .eq('category', dbCategory)
      .contains('tags', ['risk_factor']);
  } else {
    query = query.eq('category', dbCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching interventions by condition:', error);
    throw error;
  }

  return data.map((article): Intervention => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    evidenceStrength: article.content_blocks?.evidence_summary?.toLowerCase().includes('strong') 
      ? 'Strong' 
      : article.content_blocks?.evidence_summary?.toLowerCase().includes('moderate')
      ? 'Moderate'
      : article.content_blocks?.evidence_summary?.toLowerCase().includes('limited')
      ? 'Limited'
      : 'Insufficient',
    studyCount: article.content_blocks?.key_studies?.split('\n').length || 0,
    reliabilityRating: article.content_blocks?.reliability_score || 3,
    conditions: article.tags || [],
    summary: article.summary || '',
    content: article.content_blocks,
    tags: article.tags || [],
    status: article.status,
  }));
} 