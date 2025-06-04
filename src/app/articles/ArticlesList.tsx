'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Database } from '@/types/supabase';

type Article = Database['public']['Tables']['articles']['Row'];

interface ArticlesListProps {
  initialArticles: Article[];
}

export default function ArticlesList({ initialArticles }: ArticlesListProps) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>(initialArticles || []);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState('');

  const searchTopics = [
    'neuroplasticity',
    'neurotransmitters',
    'brain circuits',
    'mental health',
    'neuroscience',
    'depression',
    'anxiety',
    'brain health',
    'psychology',
    'cognition'
  ];

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    let currentIndex = 0;
    let currentText = '';
    let isDeleting = false;
    let typingSpeed = 100;

    const animatePlaceholder = () => {
      const currentTopic = searchTopics[currentIndex];
      
      if (isDeleting) {
        currentText = currentTopic.substring(0, currentText.length - 1);
      } else {
        currentText = currentTopic.substring(0, currentText.length + 1);
      }

      setPlaceholder(currentText);

      if (!isDeleting && currentText === currentTopic) {
        typingSpeed = 2000; // Pause at the end
        isDeleting = true;
      } else if (isDeleting && currentText === '') {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % searchTopics.length;
        typingSpeed = 100;
      } else {
        typingSpeed = isDeleting ? 50 : 100;
      }

      setTimeout(animatePlaceholder, typingSpeed);
    };

    animatePlaceholder();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('articles')
        .select('*')
        .eq('status', 'published');

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`
          title.ilike.%${searchQuery}%,
          summary.ilike.%${searchQuery}%,
          overview.ilike.%${searchQuery}%,
          definition.ilike.%${searchQuery}%,
          mechanisms.ilike.%${searchQuery}%
        `);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async (articleId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { error } = await supabase
        .from('saved_articles')
        .insert([
          {
            user_id: session.user.id,
            article_id: articleId,
          },
        ]);

      if (error) throw error;
      
      // Refresh the articles list to show updated save status
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
    }
  };

  return (
    <>
      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Mental Health & Neuroscience Research
        </h1>
        <div className="max-w-2xl mx-auto">
          <input
            type="text"
            id="search"
            className="mt-1 block w-full rounded-md border-2 border-gray-300 shadow-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-xl py-4 px-6 text-gray-900 placeholder-gray-500"
            placeholder={`Search for ${placeholder}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Articles List */}
      <div className="bg-white shadow rounded-lg p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-6">
            {articles.map((article) => (
              <div
                key={article.id}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <Link
                    href={`/articles/${article.slug}`}
                    className="block hover:bg-gray-50 flex-grow"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {article.title}
                    </h2>
                    <p className="text-gray-600 mb-4">{article.summary}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(article.tags || []).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="capitalize">Category: {article.category || 'Uncategorized'}</span>
                      <span className="mx-2">•</span>
                      <span>Published: {new Date(article.created_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleSaveArticle(article.id)}
                    className="ml-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Article
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No articles found.</p>
          </div>
        )}
      </div>
    </>
  );
} 