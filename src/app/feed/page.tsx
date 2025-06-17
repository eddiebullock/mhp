'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import Link from 'next/link';
import { semanticSearch } from '@/lib/search';

type Article = Database['public']['Tables']['articles']['Row'];

const supabase = createClient();

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [placeholder, setPlaceholder] = useState('');
  const [searchAnswer, setSearchAnswer] = useState<string | null>(null);
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);

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

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSearchAnswer(null);
      setIsSemanticSearch(false);
      fetchArticles();
      return;
    }

    // Check if the query is conversational/natural language
    const isNaturalLanguage = /^(how|what|why|when|where|do|does|can|could|would|should|tell|explain|help|i|my|me|we|our)/i.test(searchQuery) ||
                             searchQuery.includes('?') ||
                             searchQuery.length > 30;

    if (isNaturalLanguage) {
      setIsSemanticSearch(true);
      handleSemanticSearch();
    } else {
      setIsSemanticSearch(false);
      fetchArticles();
    }
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

  const handleSemanticSearch = async () => {
    try {
      setSearchLoading(true);
      setSearchError(null);
      const { answer, articles: relevantArticles } = await semanticSearch(searchQuery);
      setSearchAnswer(answer);
      setArticles(relevantArticles);
    } catch (error) {
      console.error('Error performing semantic search:', error);
      setSearchError('Failed to process your question. Please try rephrasing it.');
    } finally {
      setSearchLoading(false);
    }
  };

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
          content_blocks->>'overview'.ilike.%${searchQuery}%,
          content_blocks->>'definition'.ilike.%${searchQuery}%,
          content_blocks->>'mechanisms'.ilike.%${searchQuery}%
        `);
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: Article['category']) => {
    const colors = {
      mental_health: 'bg-blue-100 text-blue-800',
      neuroscience: 'bg-purple-100 text-purple-800',
      psychology: 'bg-green-100 text-green-800',
      brain_health: 'bg-yellow-100 text-yellow-800',
      neurodiversity: 'bg-indigo-100 text-indigo-800',
      interventions: 'bg-red-100 text-red-800',
      lifestyle_factors: 'bg-teal-100 text-teal-800',
      lab_testing: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
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
          <p className="mt-2 text-sm text-gray-500">
            {isSemanticSearch 
              ? "Ask any question about mental health, neuroscience, or brain health"
              : "Search for specific topics, conditions, or treatments"}
          </p>
        </div>
        
        {/* Category Filter */}
        <div className="mt-6 max-w-2xl mx-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="mental_health">Mental Health</option>
            <option value="neuroscience">Neuroscience</option>
            <option value="psychology">Psychology</option>
            <option value="brain_health">Brain Health</option>
            <option value="neurodiversity">Neurodiversity</option>
            <option value="interventions">Interventions</option>
            <option value="lifestyle_factors">Lifestyle Factors</option>
            <option value="lab_testing">Lab Testing</option>
          </select>
        </div>

        {/* Search Answer */}
        {searchAnswer && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Answer:</h3>
              <p className="text-indigo-800">{searchAnswer}</p>
            </div>
          </div>
        )}

        {/* Search Error */}
        {searchError && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{searchError}</p>
            </div>
          </div>
        )}
      </div>

      {/* Feed Section */}
      {!searchQuery && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Latest Updates
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Stay up to date with the latest evidence-based mental health content
          </p>
        </div>
      )}

      {/* Loading State */}
      {(loading || searchLoading) ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                      article.category
                    )}`}
                  >
                    {article.category.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </span>
                  <time className="text-sm text-gray-500">
                    Updated {formatDate(article.updated_at)}
                  </time>
                </div>
                <Link
                  href={`/articles/${article.slug}`}
                  className="block group"
                >
                  <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h2>
                  <p className="mt-2 text-gray-600 line-clamp-2">
                    {article.summary}
                  </p>
                </Link>
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
} 