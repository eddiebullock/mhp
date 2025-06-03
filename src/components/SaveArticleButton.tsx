'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SaveArticleButtonProps {
  articleId: string;
  userId: string;
  initialSaved?: boolean;
}

export default function SaveArticleButton({
  articleId,
  userId,
  initialSaved = false,
}: SaveArticleButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (isSaved) {
        // Remove from saved articles
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .match({ article_id: articleId, user_id: userId });

        if (error) throw error;
        setIsSaved(false);
      } else {
        // Add to saved articles
        const { error } = await supabase.from('saved_articles').insert([
          {
            article_id: articleId,
            user_id: userId,
          },
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
    >
      {isLoading ? (
        'Saving...'
      ) : isSaved ? (
        <>
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Save Article
        </>
      )}
    </button>
  );
} 