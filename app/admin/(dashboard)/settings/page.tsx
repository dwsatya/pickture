import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/auth';
import { getSettings } from '@/actions/admin-settings';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { ArrowLeft } from 'lucide-react';
import { connection } from 'next/server';

export const instant = false;

export const metadata = {
  title: 'Pengaturan — Pickture Admin',
  description: 'Atur nomor WhatsApp utama, pemisah kode foto, dan template pesan klien.',
};

export default async function AdminSettingsPage() {
  await connection();
  await requireAdmin();

  const settings = await getSettings();

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-200/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Sesi</span>
        </Link>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
