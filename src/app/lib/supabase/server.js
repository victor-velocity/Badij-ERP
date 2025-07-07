import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          // returns an array of { name: string, value: string } objects
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // cookiesToSet is an array of { name: string, value: string, options?: CookieOptions }
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `cookies()` function can only be called from a Server Component or Route Handler.
              // If you're using this client in a Client Component, it won't be able to set cookies.
              console.warn('Could not set cookie from server client:', error);
            }
          });
        },
      },
    }
  );
}