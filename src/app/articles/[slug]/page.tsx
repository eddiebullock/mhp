import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Database } from '@/types/supabase';
import ReactMarkdown from 'react-markdown';
import ArticleClient from './ArticleClient';

type Article = Database['public']['Tables']['articles']['Row'];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const supabase = await createClient();
  const { slug } = await params;
  
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: `${article.title} | Mental Health Platform`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: article.created_at,
      tags: article.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { slug } = await params;
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !article) {
    notFound();
  }

  // Check if user is an editor
  const { data: { session } } = await supabase.auth.getSession();
  let isEditor = false;

  console.log('Article page - Session:', session?.user?.id);
  console.log('Article page - User email:', session?.user?.email);

  if (session?.user) {
    const { data: editorData, error: editorError } = await supabase
      .from('article_editors')
      .select('id')
      .eq('user_id', session.user.id)
      .single();
    
    console.log('Article page - Editor data:', editorData);
    console.log('Article page - Editor error:', editorError);
    
    isEditor = !!editorData;
  }

  console.log('Article page - Is editor:', isEditor);

  return <ArticleClient article={article} isEditor={isEditor} />;
} 