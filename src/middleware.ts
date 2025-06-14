import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create a Supabase client using createServerClient (from @supabase/ssr)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Get the current path
  const path = request.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (path.startsWith('/_next') || path.startsWith('/api') || path.startsWith('/static') || path.includes('.')) {
    return response;
  }

  // Define public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/signup', '/auth/callback', '/'];
  const isPublicPath = publicPaths.some(publicPath => path === publicPath);

  // Get the session
  const { data: { session } } = await supabase.auth.getSession();
  console.log('DEBUG: Session in middleware:', session);

  // Only redirect authenticated users away from /auth/login or /auth/signup if there is NO redirect query param
  if (session && (path === '/auth/login' || path === '/auth/signup') && !request.nextUrl.searchParams.get('redirect')) {
    return NextResponse.redirect(new URL('/profile', request.url));
  }

  // If the user is not signed in and tries to access protected pages, redirect to login
  if (!session && path === '/profile') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If the user is signed out and tries to access the sign out page, redirect to home
  if (!session && path === '/auth/signout') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 