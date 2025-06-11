import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Database } from '@/types/supabase';
import ReactMarkdown from 'react-markdown';

type Article = Database['public']['Tables']['articles']['Row'];

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient();
  const slug = params.slug;
  
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

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const slug = params.slug;
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !article) {
    notFound();
  }

  const getCategoryType = (category: string): string => {
    const normalizedCategory = category.toLowerCase().trim();
    
    // Handle neuroscience category
    if (normalizedCategory === 'neuroscience' || 
        normalizedCategory === 'psychology' || 
        normalizedCategory.includes('neuroscience') || 
        normalizedCategory.includes('psychology')) {
      return 'neuroscience';
    }
    
    // Handle mental health category
    if (normalizedCategory === 'mental health' || 
        normalizedCategory === 'mental_health' || 
        normalizedCategory.includes('mental health') || 
        normalizedCategory.includes('mental_health')) {
      return 'mental health';
    }
    
    // Handle intervention category
    if (normalizedCategory === 'intervention' || 
        normalizedCategory.includes('intervention')) {
      return 'intervention';
    }
    
    // Handle lifestyle factor category
    if (normalizedCategory === 'lifestyle factor' || 
        normalizedCategory === 'lifestyle_factor' || 
        normalizedCategory.includes('lifestyle')) {
      return 'lifestyle factor';
    }
    
    // Handle lab & testing category
    if (normalizedCategory === 'lab & testing' || 
        normalizedCategory === 'lab_and_testing' || 
        normalizedCategory.includes('lab') || 
        normalizedCategory.includes('testing')) {
      return 'lab & testing';
    }
    
    return normalizedCategory;
  };

  const renderContent = () => {
    const blocks = article.content_blocks;
    if (!blocks) return null;

    return (
      <div className="prose max-w-none">
        {blocks.key_evidence && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Key Evidence</h2>
            <ReactMarkdown>{blocks.key_evidence}</ReactMarkdown>
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

        {blocks.references_and_resources && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">References and Resources</h2>
            <ReactMarkdown>{blocks.references_and_resources}</ReactMarkdown>
          </section>
        )}

        {blocks.relevance && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Relevance</h2>
            <ReactMarkdown>{blocks.relevance}</ReactMarkdown>
          </section>
        )}

        {blocks.key_studies && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Key Studies</h2>
            <ReactMarkdown>{blocks.key_studies}</ReactMarkdown>
          </section>
        )}

        {blocks.common_misconceptions && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Common Misconceptions</h2>
            <ReactMarkdown>{blocks.common_misconceptions}</ReactMarkdown>
          </section>
        )}

        {blocks.practical_implications && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Practical Implications</h2>
            <ReactMarkdown>{blocks.practical_implications}</ReactMarkdown>
          </section>
        )}

        {blocks.effectiveness && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Effectiveness</h2>
            <ReactMarkdown>{blocks.effectiveness}</ReactMarkdown>
          </section>
        )}

        {blocks.risks_and_limitations && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Risks and Limitations</h2>
            <ReactMarkdown>{blocks.risks_and_limitations}</ReactMarkdown>
          </section>
        )}

        {blocks.how_it_works && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <ReactMarkdown>{blocks.how_it_works}</ReactMarkdown>
          </section>
        )}

        {blocks.applications && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Applications</h2>
            <ReactMarkdown>{blocks.applications}</ReactMarkdown>
          </section>
        )}

        {blocks.strengths_and_limitations && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Strengths and Limitations</h2>
            <ReactMarkdown>{blocks.strengths_and_limitations}</ReactMarkdown>
          </section>
        )}

        {blocks.evidence_base && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Evidence Base</h2>
            <ReactMarkdown>{blocks.evidence_base}</ReactMarkdown>
          </section>
        )}

        {blocks.practical_applications && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Practical Applications</h2>
            <ReactMarkdown>{blocks.practical_applications}</ReactMarkdown>
          </section>
        )}

        {blocks.neurodiversity_perspective && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Neurodiversity Perspective</h2>
            <ReactMarkdown>{blocks.neurodiversity_perspective}</ReactMarkdown>
          </section>
        )}

        {blocks.common_strengths_and_challenges && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Common Strengths and Challenges</h2>
            <ReactMarkdown>{blocks.common_strengths_and_challenges}</ReactMarkdown>
          </section>
        )}

        {blocks.prevalence_and_demographics && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Prevalence and Demographics</h2>
            <ReactMarkdown>{blocks.prevalence_and_demographics}</ReactMarkdown>
          </section>
        )}

        {blocks.mechanisms_and_understanding && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Mechanisms and Understanding</h2>
            <ReactMarkdown>{blocks.mechanisms_and_understanding}</ReactMarkdown>
          </section>
        )}

        {blocks.lived_experience && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Lived Experience</h2>
            <ReactMarkdown>{blocks.lived_experience}</ReactMarkdown>
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

        {blocks.safety && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Safety</h2>
            <ReactMarkdown>{blocks.safety}</ReactMarkdown>
          </section>
        )}

        {blocks.faqs && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {blocks.faqs.map((faq: { question: string; answer: string }, index: number) => (
                <div key={index} className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {blocks.references && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">References</h2>
            <div className="space-y-2">
              {blocks.references.map((ref: string, index: number) => (
                <p key={index} className="text-sm text-gray-600">{ref}</p>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  };

  return (
    <article className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {article.category}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
            <p className="text-lg text-gray-900 mb-6">{article.summary}</p>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {(article.tags || []).map((tag: string) => (
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
                Published: {new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </article>
  );
} 