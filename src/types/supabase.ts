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
          content: string
          category_id: string
          status: 'draft' | 'published'
          author_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          slug: string
          summary: string
          content: string
          category_id: string
          status?: 'draft' | 'published'
          author_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          slug?: string
          summary?: string
          content?: string
          category_id?: string
          status?: 'draft' | 'published'
          author_id?: string
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