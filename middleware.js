// middleware.js
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (process.env.NODE_ENV === 'production') {
    const protoHeader = request.headers.get('x-forwarded-proto') || '';
    // Heroku can send: "http", "https", or "http,https"
    const protocols = protoHeader.split(',').map(p => p.trim());
    const isSecure = protocols.includes('https');

    if (!isSecure) {
      const url = new URL(request.url);
      url.protocol = 'https:';
      // Use the correct host from x-forwarded-host or host
      const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
      url.host = forwardedHost || url.host;
      url.port = ''; // remove any :80/:443
      return NextResponse.redirect(url.toString(), 301);
    }
  }

  // === 2. Supabase session handling ===
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getSession();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
};