import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Database } from '@/types/supabase';

type Article = Database['public']['Tables']['articles']['Row'];

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient();
  
  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
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
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', params.slug)
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
    const categoryType = getCategoryType(article.category);

    switch (categoryType) {
      case 'neuroscience':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Definition</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.definition || 'No definition available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mechanisms</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.mechanisms || 'No mechanisms information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Relevance</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.relevance || 'No relevance information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Studies</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.key_studies || 'No key studies available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Misconceptions</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.common_misconceptions || 'No misconceptions information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Implications</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.practical_implications || 'No practical implications available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.future_directions || 'No future directions available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {(article.references || []).map((reference: string, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <p className="text-gray-600">{reference}</p>
                  </div>
                ))}
                {(!article.references || article.references.length === 0) && (
                  <p className="text-gray-500 italic">No references available.</p>
                )}
              </div>
            </section>
          </>
        );

      case 'mental health':
        return (
          <>
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Overview</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.overview || 'No overview available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prevalence</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.prevalence || 'No prevalence information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Causes and Mechanisms</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.causes_and_mechanisms || 'No causes and mechanisms information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Symptoms and Impact</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.symptoms_and_impact || 'No symptoms and impact information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Evidence Summary</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.evidence_summary || 'No evidence summary available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Myths</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.common_myths || 'No common myths information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Takeaways</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.practical_takeaways || 'No practical takeaways available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Lived Experience</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.lived_experience || 'No lived experience information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              <div className="text-gray-600 prose prose-indigo max-w-none">{article.future_directions || 'No future directions available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {(article.references || []).map((reference: string, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <p className="text-gray-600">{reference}</p>
                  </div>
                ))}
                {(!article.references || article.references.length === 0) && (
                  <p className="text-gray-500 italic">No references available.</p>
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
              <div className="text-gray-600">{article.overview || 'No overview available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
              <div className="text-gray-600">{article.how_it_works || 'No information available on how it works.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Evidence Base</h2>
              <div className="text-gray-600">{article.evidence_base || 'No evidence base information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Effectiveness</h2>
              <div className="text-gray-600">{article.effectiveness || 'No effectiveness information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Applications</h2>
              <div className="text-gray-600">{article.practical_applications || 'No practical applications available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Common Myths</h2>
              <div className="text-gray-600">{article.common_myths || 'No common myths information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risks and Limitations</h2>
              <div className="text-gray-600">{article.risks_and_limitations || 'No risks and limitations information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              <div className="text-gray-600">{article.future_directions || 'No future directions available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {(article.references || []).map((reference: string, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <p className="text-gray-600">{reference}</p>
                  </div>
                ))}
                {(!article.references || article.references.length === 0) && (
                  <p className="text-gray-500 italic">No references available.</p>
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
              <div className="text-gray-600">{article.overview || 'No overview available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Mechanisms</h2>
              <div className="text-gray-600">{article.mechanisms || 'No mechanisms information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Evidence Summary</h2>
              <div className="text-gray-600">{article.evidence_summary || 'No evidence summary available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Practical Takeaways</h2>
              <div className="text-gray-600">{article.practical_takeaways || 'No practical takeaways available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risks and Limitations</h2>
              <div className="text-gray-600">{article.risks_and_limitations || 'No risks and limitations information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              <div className="text-gray-600">{article.future_directions || 'No future directions available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {(article.references || []).map((reference: string, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <p className="text-gray-600">{reference}</p>
                  </div>
                ))}
                {(!article.references || article.references.length === 0) && (
                  <p className="text-gray-500 italic">No references available.</p>
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
              <div className="text-gray-600">{article.overview || 'No overview available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
              <div className="text-gray-600">{article.how_it_works || 'No information available on how it works.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Applications</h2>
              <div className="text-gray-600">{article.applications || 'No applications information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Strengths and Limitations</h2>
              <div className="text-gray-600">{article.strengths_and_limitations || 'No strengths and limitations information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Risks and Safety</h2>
              <div className="text-gray-600">{article.risks_and_safety || 'No risks and safety information available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Future Directions</h2>
              <div className="text-gray-600">{article.future_directions || 'No future directions available.'}</div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">References</h2>
              <div className="space-y-4">
                {(article.references || []).map((reference: string, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <p className="text-gray-600">{reference}</p>
                  </div>
                ))}
                {(!article.references || article.references.length === 0) && (
                  <p className="text-gray-500 italic">No references available.</p>
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
            <p className="text-lg text-gray-600 mb-6">{article.summary}</p>
            
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

            <div className="prose prose-indigo max-w-none">
              {renderContent()}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Published: {new Date(article.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </article>
  );
} 