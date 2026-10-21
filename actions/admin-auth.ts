'use server';

import { createAuthServerClient } from '@/lib/supabase/auth';
import { loginSchema } from '@/lib/validations';
import { redirect } from 'next/navigation';

export interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Server action to log in the admin user using Supabase Auth.
 */
export async function loginAction(values: { email: string; password: string }): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Data login tidak valid.',
    };
  }

  const { email, password } = parsed.data;

  try {
    const supabase = await createAuthServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let friendlyMessage = 'Gagal masuk. Silakan periksa email dan password Anda.';
      if (
        error.message.toLowerCase().includes('invalid login credentials') ||
        error.message.toLowerCase().includes('invalid credentials')
      ) {
        friendlyMessage = 'Email atau password salah. Silakan coba lagi.';
      } else if (error.message.toLowerCase().includes('email not confirmed')) {
        friendlyMessage = 'Email belum dikonfirmasi di Supabase Auth.';
      }

      return {
        success: false,
        error: friendlyMessage,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Terjadi kendala sistem: ${msg}`,
    };
  }
}

/**
 * Server action to log out the admin user and redirect to login page.
 */
export async function logoutAction() {
  try {
    const supabase = await createAuthServerClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
  }
  redirect('/admin/login');
}
