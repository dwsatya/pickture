import { getAdminUser } from '@/lib/supabase/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/LoginForm';
import { connection } from 'next/server';

export const instant = false;

export default async function AdminLoginPage() {
  await connection();
  const user = await getAdminUser();
  if (user) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-stone-50/80 relative flex flex-col justify-between p-4 sm:p-6 selection:bg-amber-100 selection:text-amber-900">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-amber-200/35 via-amber-100/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-gradient-to-t from-stone-200/40 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="h-4" />

      <main className="flex-1 flex items-center justify-center my-6">
        <LoginForm />
      </main>

      <footer className="text-center text-xs text-stone-400 py-4">
        Pickture &copy; 2026 &mdash; Portal Khusus Fotografer
      </footer>
    </div>
  );
}
