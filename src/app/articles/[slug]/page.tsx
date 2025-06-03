import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: {
    overview: string;
    mechanisms: string;
    safety: string;
    faqs: Array<{ question: string; answer: string }>;
    keyEvidence: string;
    practicalTakeaways: string;
  };
  tags: string[];
  created_at: string;
  updated_at: string;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient();
  const slug = await params.slug;
  
  // Log the params for debugging
  console.log('Metadata params:', slug);
  
  // Try to find article by slug
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!article) {
    console.log('Article not found for slug:', slug);
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
      modifiedTime: article.updated_at,
      tags: article.tags || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const slug = await params.slug;
  
  // Log the params for debugging
  console.log('Page params:', slug);
  
  // Try to find article by slug
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching article:', error);
    notFound();
  }

  if (!article) {
    console.log('Article not found for slug:', slug);
    notFound();
  }

  // Ensure article has all required fields with defaults
  const safeArticle = {
    ...article,
    tags: article.tags || [],
    content: {
      overview: article.content?.overview || '',
      mechanisms: article.content?.mechanisms || '',
      safety: article.content?.safety || '',
      faqs: article.content?.faqs || [],
      keyEvidence: article.content?.keyEvidence || '',
      practicalTakeaways: article.content?.practicalTakeaways || '',
    },
  };

  return (
    <article className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{safeArticle.title}</h1>
            <p className="text-lg text-gray-600 mb-6">{safeArticle.summary}</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {safeArticle.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-indigo max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
                <div className="text-gray-600">{safeArticle.content.overview}</div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mechanisms</h2>
                <div className="text-gray-600">{safeArticle.content.mechanisms}</div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Safety Information</h2>
                <div className="text-gray-600">{safeArticle.content.safety}</div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {safeArticle.content.faqs.map((faq: { question: string; answer: string }, index: number) => (
                    <div key={index} className="border-b border-gray-200 pb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Evidence</h2>
                <div className="text-gray-600">{safeArticle.content.keyEvidence}</div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Takeaways</h2>
                <div className="text-gray-600">{safeArticle.content.practicalTakeaways}</div>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Last updated: {new Date(safeArticle.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </article>
  );
} 