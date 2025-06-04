export type ArticleCategory =
  | 'mental_health'
  | 'neuroscience'
  | 'psychology'
  | 'brain_health'
  | 'neurodiversity'
  | 'interventions'
  | 'lifestyle_factors'
  | 'lab_testing';

export interface BaseArticle {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  created_at: string;
  updated_at: string;
  author_id: string;
  status: 'draft' | 'published';
  future_directions?: string;
  references_and_resources?: string;
}

export interface MentalHealthArticle extends BaseArticle {
  category: 'mental_health';
  overview: string;
  prevalence: string;
  causes_and_mechanisms: string;
  symptoms_and_impact: string;
  evidence_summary: string;
  common_myths: string;
  practical_takeaways: string;
}

export interface NeuroscienceArticle extends BaseArticle {
  category: 'neuroscience';
  definition: string;
  mechanisms: string;
  relevance: string;
  key_studies: string;
  common_misconceptions: string;
  practical_implications: string;
}

export interface InterventionArticle extends BaseArticle {
  category: 'interventions';
  overview: string;
  how_it_works: string;
  evidence_base: string;
  effectiveness: string;
  practical_applications: string;
  common_myths: string;
  risks_and_limitations: string;
}

export interface LifestyleArticle extends BaseArticle {
  category: 'lifestyle_factors';
  overview: string;
  mechanisms: string;
  evidence_summary: string;
  practical_takeaways: string;
  risks_and_limitations: string;
}

export interface LabTestingArticle extends BaseArticle {
  category: 'lab_testing';
  overview: string;
  how_it_works: string;
  applications: string;
  strengths_and_limitations: string;
  risks_and_limitations: string;
}

export type Article =
  | MentalHealthArticle
  | NeuroscienceArticle
  | InterventionArticle
  | LifestyleArticle
  | LabTestingArticle; 