// middleware.js
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request) {
  // === 1. FORCE HTTPS ON HEROKU (must be first!) ===
  const requestHeaders = new Headers(request.headers);
  const proto = requestHeaders.get('x-forwarded-proto');
  const host = requestHeaders.get('host') || '';

  // Heroku sends either no header, "http", or sometimes includes :80
  const isHttpRequest = !proto || proto === 'http' || host.endsWith(':80');

  if (isHttpRequest && process.env.NODE_ENV === 'production') {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.port = ''; // remove :80 if present
    return NextResponse.redirect(url, 301);
  }

  // === 2. Supabase session handling (unchanged) ===
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getSession();

  return response;
}

// Run on everything except static files and API routes you want to skip
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - auth callback route (if you use Supabase /auth/callback)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};