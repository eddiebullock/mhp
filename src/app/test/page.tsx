import { supabase } from '@/lib/supabase';

export default async function TestPage() {
  try {
    // Test query to fetch categories
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (error) {
      throw error;
    }

    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
        <div className="bg-green-100 p-4 rounded-lg mb-4">
          <p className="text-green-800">✅ Successfully connected to Supabase!</p>
        </div>
        
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
          <p className="text-gray-600">No categories found. You may need to create some in your Supabase database.</p>
        )}
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