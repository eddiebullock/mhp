import { supabase } from '@/lib/supabase';

export default async function TestPage() {
  try {
    // Fetch both categories and articles
    const [categoriesResponse, articlesResponse] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .limit(5),
      supabase
        .from('articles')
        .select(`
          *,
          categories (
            name
          )
        `)
        .limit(5)
    ]);

    const { data: categories, error: categoriesError } = categoriesResponse;
    const { data: articles, error: articlesError } = articlesResponse;

    if (categoriesError) throw categoriesError;
    if (articlesError) throw articlesError;

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        <div className="bg-green-100 p-4 rounded-lg mb-4">
          <p className="text-green-800">✅ Successfully connected to Supabase!</p>
        </div>
        
        {/* Categories Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Categories:</h2>
          {categories && categories.length > 0 ? (
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id} className="bg-white p-4 rounded shadow">
                  <p className="font-medium">{category.name}</p>
                  {category.description && (
                    <p className="text-gray-600">{category.description}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No categories found.</p>
          )}
        </section>

        {/* Articles Section */}
        <section>
          <h2 className="text-xl font-semibold mb-2">Articles:</h2>
          {articles && articles.length > 0 ? (
            <ul className="space-y-4">
              {articles.map((article) => (
                <li key={article.id} className="bg-white p-4 rounded shadow">
                  <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                  <p className="text-gray-600 mb-2">{article.summary}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Category: {article.categories?.name}</span>
                    <span>•</span>
                    <span>Status: {article.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No articles found.</p>
          )}
        </section>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-red-800">❌ Error connecting to Supabase:</p>
          <pre className="mt-2 text-sm bg-red-50 p-2 rounded">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </pre>
        </div>
      </div>
    );
  }
} 