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

  const renderMarkdown = (content: string | null) => {
    if (!content) return null;
    return (
      <div className="prose prose-gray max-w-none [&_*]:text-black [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_h4]:text-gray-900">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  };

  const renderContent = () => {
    switch (article.category) {
      case 'mental_health':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              {renderMarkdown(article.overview) || <p className="text-gray-500 italic">No overview available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prevalence</h2>
              {renderMarkdown(article.prevalence) || <p className="text-gray-500 italic">No prevalence information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Causes and Mechanisms</h2>
              {renderMarkdown(article.causes_and_mechanisms) || <p className="text-gray-500 italic">No causes and mechanisms information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Symptoms and Impact</h2>
              {renderMarkdown(article.symptoms_and_impact) || <p className="text-gray-500 italic">No symptoms and impact information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Evidence Summary</h2>
              {renderMarkdown(article.evidence_summary) || <p className="text-gray-500 italic">No evidence summary available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Takeaways</h2>
              {renderMarkdown(article.practical_takeaways) || <p className="text-gray-500 italic">No practical takeaways available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Myths</h2>
              {renderMarkdown(article.common_myths) || <p className="text-gray-500 italic">No common myths information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              {renderMarkdown(article.future_directions) || <p className="text-gray-500 italic">No future directions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {article.references_and_resources ? (
                  <div className="prose prose-gray max-w-none prose-p:text-gray-900 prose-li:text-gray-900">
                    <ReactMarkdown>{article.references_and_resources}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">References coming soon.</p>
                )}
              </div>
            </section>
          </>
        );

      case 'psychology':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              {renderMarkdown(article.overview) || <p className="text-gray-500 italic">No overview available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Definition</h2>
              {renderMarkdown(article.definition) || <p className="text-gray-500 italic">No definition available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Core Principles</h2>
              {renderMarkdown(article.core_principles) || <p className="text-gray-500 italic">No core principles available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Relevance</h2>
              {renderMarkdown(article.relevance) || <p className="text-gray-500 italic">No relevance information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Studies and Theories</h2>
              {renderMarkdown(article.key_studies_and_theories) || <p className="text-gray-500 italic">No key studies and theories available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Misconceptions</h2>
              {renderMarkdown(article.common_misconceptions) || <p className="text-gray-500 italic">No common misconceptions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Applications</h2>
              {renderMarkdown(article.practical_applications) || <p className="text-gray-500 italic">No practical applications available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              {renderMarkdown(article.future_directions) || <p className="text-gray-500 italic">No future directions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {article.references_and_resources ? (
                  <div className="prose prose-gray max-w-none prose-p:text-gray-900 prose-li:text-gray-900">
                    <ReactMarkdown>{article.references_and_resources}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">References coming soon.</p>
                )}
              </div>
            </section>
          </>
        );

      case 'neurodiversity':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              {renderMarkdown(article.overview) || <p className="text-gray-500 italic">No overview available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Neurodiversity Perspective</h2>
              {renderMarkdown(article.neurodiversity_perspective) || <p className="text-gray-500 italic">No neurodiversity perspective available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Strengths and Challenges</h2>
              {renderMarkdown(article.common_strengths_and_challenges) || <p className="text-gray-500 italic">No information available on common strengths and challenges.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prevalence and Demographics</h2>
              {renderMarkdown(article.prevalence_and_demographics) || <p className="text-gray-500 italic">No prevalence and demographics information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mechanisms and Understanding</h2>
              {renderMarkdown(article.mechanisms_and_understanding) || <p className="text-gray-500 italic">No mechanisms and understanding information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Evidence Summary</h2>
              {renderMarkdown(article.evidence_summary) || <p className="text-gray-500 italic">No evidence summary available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Misconceptions</h2>
              {renderMarkdown(article.common_misconceptions) || <p className="text-gray-500 italic">No common misconceptions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Takeaways</h2>
              {renderMarkdown(article.practical_takeaways) || <p className="text-gray-500 italic">No practical takeaways available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Lived Experience</h2>
              {renderMarkdown(article.lived_experience) || <p className="text-gray-500 italic">No lived experience information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              {renderMarkdown(article.future_directions) || <p className="text-gray-500 italic">No future directions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {article.references_and_resources ? (
                  <div className="prose prose-gray max-w-none prose-p:text-gray-900 prose-li:text-gray-900">
                    <ReactMarkdown>{article.references_and_resources}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">References coming soon.</p>
                )}
              </div>
            </section>
          </>
        );

      case 'neuroscience':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Definition</h2>
              {renderMarkdown(article.definition) || <p className="text-gray-500 italic">No definition available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mechanisms</h2>
              {renderMarkdown(article.mechanisms) || <p className="text-gray-500 italic">No mechanisms information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Relevance</h2>
              {renderMarkdown(article.relevance) || <p className="text-gray-500 italic">No relevance information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Studies</h2>
              {renderMarkdown(article.key_studies) || <p className="text-gray-500 italic">No key studies available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Misconceptions</h2>
              {renderMarkdown(article.common_misconceptions) || <p className="text-gray-500 italic">No misconceptions information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Implications</h2>
              {renderMarkdown(article.practical_implications) || <p className="text-gray-500 italic">No practical implications available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              {renderMarkdown(article.future_directions) || <p className="text-gray-500 italic">No future directions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {article.references_and_resources ? (
                  <div className="prose prose-gray max-w-none prose-p:text-gray-900 prose-li:text-gray-900">
                    <ReactMarkdown>{article.references_and_resources}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">References coming soon.</p>
                )}
              </div>
            </section>
          </>
        );

      case 'intervention':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              {renderMarkdown(article.overview) || <p className="text-gray-500 italic">No overview available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
              {renderMarkdown(article.how_it_works) || <p className="text-gray-500 italic">No information available on how it works.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Evidence Base</h2>
              {renderMarkdown(article.evidence_base) || <p className="text-gray-500 italic">No evidence base information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Effectiveness</h2>
              {renderMarkdown(article.effectiveness) || <p className="text-gray-500 italic">No effectiveness information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Applications</h2>
              {renderMarkdown(article.practical_applications) || <p className="text-gray-500 italic">No practical applications available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Myths</h2>
              {renderMarkdown(article.common_myths) || <p className="text-gray-500 italic">No common myths information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risks and Limitations</h2>
              {renderMarkdown(article.risks_and_limitations) || <p className="text-gray-500 italic">No risks and limitations information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              {renderMarkdown(article.future_directions) || <p className="text-gray-500 italic">No future directions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {article.references_and_resources ? (
                  <div className="prose prose-gray max-w-none prose-p:text-gray-900 prose-li:text-gray-900">
                    <ReactMarkdown>{article.references_and_resources}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">References coming soon.</p>
                )}
              </div>
            </section>
          </>
        );

      case 'lifestyle factor':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              {renderMarkdown(article.overview) || <p className="text-gray-500 italic">No overview available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mechanisms</h2>
              {renderMarkdown(article.mechanisms) || <p className="text-gray-500 italic">No mechanisms information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Evidence Summary</h2>
              {renderMarkdown(article.evidence_summary) || <p className="text-gray-500 italic">No evidence summary available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Takeaways</h2>
              {renderMarkdown(article.practical_takeaways) || <p className="text-gray-500 italic">No practical takeaways available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risks and Limitations</h2>
              {renderMarkdown(article.risks_and_limitations) || <p className="text-gray-500 italic">No risks and limitations information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              {renderMarkdown(article.future_directions) || <p className="text-gray-500 italic">No future directions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {article.references_and_resources ? (
                  <div className="prose prose-gray max-w-none prose-p:text-gray-900 prose-li:text-gray-900">
                    <ReactMarkdown>{article.references_and_resources}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">References coming soon.</p>
                )}
              </div>
            </section>
          </>
        );

      case 'lab & testing':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              {renderMarkdown(article.overview) || <p className="text-gray-500 italic">No overview available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
              {renderMarkdown(article.how_it_works) || <p className="text-gray-500 italic">No information available on how it works.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Applications</h2>
              {renderMarkdown(article.applications) || <p className="text-gray-500 italic">No applications information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Strengths and Limitations</h2>
              {renderMarkdown(article.strengths_and_limitations) || <p className="text-gray-500 italic">No strengths and limitations information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risks and Limitations</h2>
              {renderMarkdown(article.risks_and_limitations) || <p className="text-gray-500 italic">No risks and limitations information available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              {renderMarkdown(article.future_directions) || <p className="text-gray-500 italic">No future directions available.</p>}
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {article.references_and_resources ? (
                  <div className="prose prose-gray max-w-none prose-p:text-gray-900 prose-li:text-gray-900">
                    <ReactMarkdown>{article.references_and_resources}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">References coming soon.</p>
                )}
              </div>
            </section>
          </>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">Unknown article category.</p>
          </div>
        );
    }
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