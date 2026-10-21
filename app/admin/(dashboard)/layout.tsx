import Link from 'next/link';
import Image from 'next/image';
import { requireAdmin } from '@/lib/supabase/auth';
import { LogoutButton } from '@/components/admin/LogoutButton';
import { AdminDesktopNav, AdminMobileNav } from '@/components/admin/AdminNav';
import { ShieldCheck, Sparkles } from 'lucide-react';

import { connection } from 'next/server';

export const instant = false;

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between text-stone-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center gap-3">
              <Image
                src="/picture.png"
                alt="Pickture"
                width={996}
                height={376}
                priority
                className="h-8 w-auto object-contain"
              />
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                Admin
              </span>
            </Link>

            <AdminDesktopNav />
          </div>

          {/* Right Section: User & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 border border-stone-200/80 text-xs text-stone-700">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium truncate max-w-[200px]" title={user.email}>
                {user.email}
              </span>
            </div>

            <LogoutButton />
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <AdminMobileNav />
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-5 text-center text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Pickture Admin &mdash; Tahap 2 Aktif</span>
          </div>
          <p>Terhubung ke Supabase Auth secara aman.</p>
        </div>
      </footer>
    </div>
  );
}
