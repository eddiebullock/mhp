import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateArticleStatus() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .update({ status: 'published' })
      .eq('slug', 'understanding-depression')
      .select();

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      console.log('Successfully updated article status to published:', data[0]);
    } else {
      console.log('No article found with slug: understanding-depression');
    }
  } catch (error) {
    console.error('Error updating article status:', error);
    process.exit(1);
  }
}

updateArticleStatus(); 