import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: Parameters<typeof cookieStore.set>[2]) => {
          try { cookieStore.set(name, value, options); } catch { /* Server Components can't set cookies */ }
        },
        remove: (name: string, options: Parameters<typeof cookieStore.set>[2]) => {
          try { cookieStore.set(name, '', { ...options, maxAge: 0 }); } catch { /* Server Components can't set cookies */ }
        },
      },
    }
  );
};
