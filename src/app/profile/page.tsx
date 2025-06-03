import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { Database } from '@/types/supabase';

type SavedArticle = Database['public']['Tables']['saved_articles']['Row'] & {
  articles: Database['public']['Tables']['articles']['Row'] & {
    categories: Database['public']['Tables']['categories']['Row'];
  };
};

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Fetch user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session!.user.id)
    .single();

  // Fetch user's saved articles
  const { data: savedArticles } = await supabase
    .from('saved_articles')
    .select(`
      *,
      articles (
        id,
        title,
        summary,
        slug,
        categories (
          name
        )
      )
    `)
    .eq('user_id', session!.user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.username}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Saved Articles</h2>
        {savedArticles && savedArticles.length > 0 ? (
          <div className="space-y-4">
            {savedArticles.map((saved: SavedArticle) => (
              <div
                key={saved.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <Link href={`/articles/${saved.articles.slug}`}>
                  <h3 className="text-lg font-semibold text-indigo-600 hover:text-indigo-500">
                    {saved.articles.title}
                  </h3>
                </Link>
                <p className="text-gray-600 mt-1">{saved.articles.summary}</p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span>Category: {saved.articles.categories?.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">You haven't saved any articles yet.</p>
        )}
      </div>
    </div>
  );
} 