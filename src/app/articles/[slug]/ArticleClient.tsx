'use client';

import { useState } from 'react';
import { Database } from '@/types/supabase';
import ReactMarkdown from 'react-markdown';
import ArticleEditor from '@/components/ArticleEditor';

type Article = Database['public']['Tables']['articles']['Row'];

type ArticleClientProps = {
  article: Article;
  isEditor: boolean;
};

export default function ArticleClient({ article, isEditor }: ArticleClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(article);

  console.log('ArticleClient - isEditor prop:', isEditor);
  console.log('ArticleClient - article:', article.title);
  console.log('ArticleClient - Current user session:', typeof window !== 'undefined' ? 'Client side' : 'Server side');

  // Temporarily show edit button for all users for testing
  const showEditButton = true; // isEditor || true; // Temporarily show for all users

  const handleSave = () => {
    setIsEditing(false);
    // Refresh the page to show updated content
    window.location.reload();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const renderContent = () => {
    const blocks = currentArticle.content_blocks;
    if (!blocks) return null;

    return (
      <div className="prose max-w-none">
        {(blocks as any).key_evidence && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Key Evidence</h2>
            <ReactMarkdown>{(blocks as any).key_evidence}</ReactMarkdown>
          </section>
        )}

        {blocks.practical_takeaways && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Practical Takeaways</h2>
            <ReactMarkdown>{blocks.practical_takeaways}</ReactMarkdown>
          </section>
        )}

        {blocks.overview && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Overview</h2>
            <ReactMarkdown>{blocks.overview}</ReactMarkdown>
          </section>
        )}

        {blocks.definition && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Definition</h2>
            <ReactMarkdown>{blocks.definition}</ReactMarkdown>
          </section>
        )}

        {blocks.mechanisms && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Mechanisms</h2>
            <ReactMarkdown>{blocks.mechanisms}</ReactMarkdown>
          </section>
        )}

        {blocks.prevalence && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Prevalence</h2>
            <ReactMarkdown>{blocks.prevalence}</ReactMarkdown>
          </section>
        )}

        {blocks.causes_and_mechanisms && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Causes and Mechanisms</h2>
            <ReactMarkdown>{blocks.causes_and_mechanisms}</ReactMarkdown>
          </section>
        )}

        {blocks.symptoms_and_impact && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Symptoms and Impact</h2>
            <ReactMarkdown>{blocks.symptoms_and_impact}</ReactMarkdown>
          </section>
        )}

        {blocks.evidence_summary && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Evidence Summary</h2>
            <ReactMarkdown>{blocks.evidence_summary}</ReactMarkdown>
          </section>
        )}

        {blocks.common_myths && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Common Myths</h2>
            <ReactMarkdown>{blocks.common_myths}</ReactMarkdown>
          </section>
        )}

        {blocks.future_directions && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Future Directions</h2>
            <ReactMarkdown>{blocks.future_directions}</ReactMarkdown>
          </section>
        )}

        {blocks.strengths_and_limitations && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Strengths and Limitations</h2>
            <ReactMarkdown>{blocks.strengths_and_limitations}</ReactMarkdown>
          </section>
        )}

        {blocks.core_principles && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Core Principles</h2>
            <ReactMarkdown>{blocks.core_principles}</ReactMarkdown>
          </section>
        )}

        {blocks.key_studies_and_theories && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Key Studies and Theories</h2>
            <ReactMarkdown>{blocks.key_studies_and_theories}</ReactMarkdown>
          </section>
        )}

        {(blocks as any).safety && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Safety</h2>
            <ReactMarkdown>{(blocks as any).safety}</ReactMarkdown>
          </section>
        )}

        {(blocks as any).faqs && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {(blocks as any).faqs.map((faq: { question: string; answer: string }, index: number) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {blocks.references_and_resources && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">References and Resources</h2>
            <ReactMarkdown>{blocks.references_and_resources}</ReactMarkdown>
          </section>
        )}
      </div>
    );
  };

  if (isEditing) {
    return (
      <article className="min-h-screen bg-gray-50">
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Article</h1>
              <ArticleEditor 
                article={currentArticle as any} 
                onSave={handleSave} 
                onCancel={handleCancel} 
              />
            </div>
          </div>
        </main>
      </article>
    );
  }

  return (
    <article className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex justify-between items-start mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {currentArticle.category}
              </span>
              {showEditButton && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Edit Article
                </button>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentArticle.title}</h1>
            <p className="text-lg text-gray-900 mb-6">{currentArticle.summary}</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {(currentArticle.tags || []).map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-gray max-w-none [&_*]:text-black [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900">
              {renderContent()}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-900">
                Published: {new Date(currentArticle.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </article>
  );
} 