import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

/**
 * Returns a Supabase client configured with the service role key.
 * This client bypasses Row Level Security (RLS) and must ONLY be used on the server.
 */
export function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Supabase environment variables missing: Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const createAdminSupabaseClient = getAdminClient;
