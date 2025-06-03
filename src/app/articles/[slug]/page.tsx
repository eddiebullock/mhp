'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface Article {
  id: string;
  title: string;
  summary: string;
  content: {
    overview: string;
    mechanisms: string;
    safety: string;
    faq: Array<{ q: string; a: string }>;
    key_evidence: Array<{ title: string; link: string }>;
    practical_takeaways: string[];
  };
  category: string;
}

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select(`
            id,
            title,
            summary,
            content,
            categories (
              name
            )
          `)
          .eq('id', params.slug)
          .single();

        if (error) throw error;

        setArticle({
          ...data,
          category: data.categories?.name || 'Uncategorized'
        });
      } catch (error: any) {
        console.error('Error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex items-center">
                  <span className="text-xl font-bold text-indigo-600">MHP</span>
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/articles"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Browse Articles
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link href="/" className="flex items-center">
                  <span className="text-xl font-bold text-indigo-600">MHP</span>
                </Link>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/articles"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Browse Articles
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error || 'Article not found'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-indigo-600">MHP</span>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/articles"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Browse Articles
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
              <p className="mt-2 text-lg text-gray-500">{article.summary}</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {article.category}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="prose max-w-none">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
                <p className="text-gray-700 mb-8">{article.content.overview}</p>

                <h2 className="text-xl font-semibold text-gray-900 mb-4">Mechanisms</h2>
                <p className="text-gray-700 mb-8">{article.content.mechanisms}</p>

                <h2 className="text-xl font-semibold text-gray-900 mb-4">Safety Information</h2>
                <p className="text-gray-700 mb-8">{article.content.safety}</p>

                <h2 className="text-xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4 mb-8">
                  {article.content.faq.map((item, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">{item.q}</h3>
                      <p className="text-gray-700">{item.a}</p>
                    </div>
                  ))}
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Evidence</h2>
                <ul className="list-disc pl-5 space-y-2 mb-8">
                  {article.content.key_evidence.map((item, index) => (
                    <li key={index} className="text-gray-700">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>

                <h2 className="text-xl font-semibold text-gray-900 mb-4">Practical Takeaways</h2>
                <ul className="list-disc pl-5 space-y-2">
                  {article.content.practical_takeaways.map((item, index) => (
                    <li key={index} className="text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 