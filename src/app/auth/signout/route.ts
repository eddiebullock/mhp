import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
 
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/auth/login', 'http://localhost:3000'));
} 