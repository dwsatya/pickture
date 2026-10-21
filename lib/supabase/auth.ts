import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { User } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for reading and updating user sessions via Next.js cookies.
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Supabase environment variables missing: Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from a Server Component
        }
      },
    },
  });
}

/**
 * Gets the currently authenticated admin user, or returns null if not logged in.
 */
export async function getAdminUser(): Promise<User | null> {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err;
    }
    console.error('Error fetching admin user:', err);
    return null;
  }
}

/**
 * Asserts that the request comes from an authenticated admin.
 * Redirects to /admin/login if unauthenticated.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getAdminUser();
  if (!user) {
    redirect('/admin/login');
  }
  return user;
}
