export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      articles: {
        Row: {
          id: string
          created_at: string
          title: string
          slug: string
          summary: string
          category: string
          status: 'published' | 'draft'
          tags: string[]
          content_blocks: {
            overview?: string
            definition?: string
            mechanisms?: string
            prevalence?: string
            causes_and_mechanisms?: string
            symptoms_and_impact?: string
            evidence_summary?: string
            common_myths?: string
            practical_takeaways?: string
            future_directions?: string
            references_and_resources?: string
            relevance?: string
            key_studies?: string
            common_misconceptions?: string
            practical_implications?: string
            effectiveness?: string
            risks_and_limitations?: string
            how_it_works?: string
            applications?: string
            strengths_and_limitations?: string
            evidence_base?: string
            practical_applications?: string
            neurodiversity_perspective?: string
            common_strengths_and_challenges?: string
            prevalence_and_demographics?: string
            mechanisms_and_understanding?: string
            lived_experience?: string
            core_principles?: string
            key_studies_and_theories?: string
          }
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          slug: string
          summary: string
          category: string
          status?: 'published' | 'draft'
          tags?: string[]
          content_blocks?: {
            overview?: string
            definition?: string
            mechanisms?: string
            prevalence?: string
            causes_and_mechanisms?: string
            symptoms_and_impact?: string
            evidence_summary?: string
            common_myths?: string
            practical_takeaways?: string
            future_directions?: string
            references_and_resources?: string
            relevance?: string
            key_studies?: string
            common_misconceptions?: string
            practical_implications?: string
            effectiveness?: string
            risks_and_limitations?: string
            how_it_works?: string
            applications?: string
            strengths_and_limitations?: string
            evidence_base?: string
            practical_applications?: string
            neurodiversity_perspective?: string
            common_strengths_and_challenges?: string
            prevalence_and_demographics?: string
            mechanisms_and_understanding?: string
            lived_experience?: string
            core_principles?: string
            key_studies_and_theories?: string
          }
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          slug?: string
          summary?: string
          category?: string
          status?: 'published' | 'draft'
          tags?: string[]
          content_blocks?: {
            overview?: string
            definition?: string
            mechanisms?: string
            prevalence?: string
            causes_and_mechanisms?: string
            symptoms_and_impact?: string
            evidence_summary?: string
            common_myths?: string
            practical_takeaways?: string
            future_directions?: string
            references_and_resources?: string
            relevance?: string
            key_studies?: string
            common_misconceptions?: string
            practical_implications?: string
            effectiveness?: string
            risks_and_limitations?: string
            how_it_works?: string
            applications?: string
            strengths_and_limitations?: string
            evidence_base?: string
            practical_applications?: string
            neurodiversity_perspective?: string
            common_strengths_and_challenges?: string
            prevalence_and_demographics?: string
            mechanisms_and_understanding?: string
            lived_experience?: string
            core_principles?: string
            key_studies_and_theories?: string
          }
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
      }
      saved_articles: {
        Row: {
          id: string
          user_id: string
          article_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 