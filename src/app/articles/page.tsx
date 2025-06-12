import { createClient } from '@/lib/supabase/server';
import ArticlesList from './ArticlesList';

export default async function ArticlesPage() {
  const supabase = await createClient();
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', JSON.stringify(error, null, 2));
    return <div>Error loading articles: {error.message || JSON.stringify(error)}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Articles</h1>
          <ArticlesList initialArticles={articles || []} />
        </div>
      </main>
    </div>
  );
} 