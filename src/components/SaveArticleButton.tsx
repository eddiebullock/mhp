'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface SaveArticleButtonProps {
  articleId: string;
  userId: string | null;
  initialSaved?: boolean;
}

export default function SaveArticleButton({
  articleId,
  userId,
  initialSaved = false,
}: SaveArticleButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    const supabase = createClient();
    setIsLoading(true);
    try {
      if (!userId) {
        // Prompt login/signup
        router.push('/auth/login');
        return;
      }
      if (isSaved) {
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .match({ article_id: articleId, user_id: userId });
        if (error) throw error;
        setIsSaved(false);
      } else {
        const { error } = await supabase.from('saved_articles').insert([
          { article_id: articleId, user_id: userId },
        ]);
        if (error) throw error;
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isLoading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
        isSaved
          ? 'bg-green-600 hover:bg-green-700'
          : 'bg-indigo-600 hover:bg-indigo-700'
      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
      title={userId ? (isSaved ? 'Unsave Article' : 'Save Article') : 'Log in to save articles'}
    >
      {isLoading ? (
        'Saving...'
      ) : (
        <>
          {/* Classic floppy disk save icon */}
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M17 3a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3zm-2 0v4H5V3h10zm-5 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
          </svg>
          {isSaved ? 'Saved' : 'Save Article'}
        </>
      )}
    </button>
  );
} 