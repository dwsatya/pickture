'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderKanban, Settings } from 'lucide-react';

export function AdminDesktopNav() {
  const pathname = usePathname();

  const isSettingsActive = pathname === '/admin/settings';
  const isSessionsActive =
    !isSettingsActive && (pathname === '/admin' || pathname.startsWith('/admin/sessions'));

  return (
    <nav className="hidden md:flex items-center gap-1.5">
      <Link
        href="/admin"
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
          isSessionsActive
            ? 'bg-amber-50 text-amber-900 border border-amber-200/90 font-bold shadow-xs'
            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 font-medium border border-transparent'
        }`}
      >
        <FolderKanban
          className={`h-4 w-4 transition-colors ${
            isSessionsActive ? 'text-amber-600' : 'text-stone-400'
          }`}
        />
        <span>Daftar Sesi</span>
      </Link>

      <Link
        href="/admin/settings"
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
          isSettingsActive
            ? 'bg-amber-50 text-amber-900 border border-amber-200/90 font-bold shadow-xs'
            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100 font-medium border border-transparent'
        }`}
      >
        <Settings
          className={`h-4 w-4 transition-colors ${
            isSettingsActive ? 'text-amber-600' : 'text-stone-400'
          }`}
        />
        <span>Pengaturan</span>
      </Link>
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  const isSettingsActive = pathname === '/admin/settings';
  const isSessionsActive =
    !isSettingsActive && (pathname === '/admin' || pathname.startsWith('/admin/sessions'));

  return (
    <div className="md:hidden flex items-center justify-around border-t border-stone-100 py-2 px-4 bg-stone-50/70">
      <Link
        href="/admin"
        className={`flex items-center gap-1.5 text-xs py-1.5 px-3.5 rounded-xl transition-all ${
          isSessionsActive
            ? 'bg-amber-50 text-amber-900 border border-amber-200/90 font-bold shadow-xs'
            : 'text-stone-500 hover:text-stone-800 font-medium'
        }`}
      >
        <FolderKanban
          className={`h-3.5 w-3.5 ${
            isSessionsActive ? 'text-amber-600' : 'text-stone-400'
          }`}
        />
        <span>Sesi Foto</span>
      </Link>

      <Link
        href="/admin/settings"
        className={`flex items-center gap-1.5 text-xs py-1.5 px-3.5 rounded-xl transition-all ${
          isSettingsActive
            ? 'bg-amber-50 text-amber-900 border border-amber-200/90 font-bold shadow-xs'
            : 'text-stone-500 hover:text-stone-800 font-medium'
        }`}
      >
        <Settings
          className={`h-3.5 w-3.5 ${
            isSettingsActive ? 'text-amber-600' : 'text-stone-400'
          }`}
        />
        <span>Pengaturan</span>
      </Link>
    </div>
  );
}
