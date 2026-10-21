import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/auth';
import { getAdminClient } from '@/lib/supabase/server';
import { SessionTable, SessionItem } from '@/components/admin/SessionTable';
import { Button } from '@/components/ui/button';
import {
  FolderKanban,
  Plus,
  Images,
  CheckCircle2,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react';

import { connection } from 'next/server';
import { headers } from 'next/headers';

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  await requireAdmin();
  const supabase = getAdminClient();

  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  // Fetch all sessions with photo counts and selection counts
  const [{ data: sessionsData }, { data: settings }] = await Promise.all([
    supabase
      .from('sessions')
      .select(`
        id,
        slug,
        client_name,
        client_phone,
        university,
        graduation_date,
        max_selection,
        status,
        expires_at,
        last_synced_at,
        created_at,
        photos:photos!photos_session_id_fkey(count),
        selections:selections!selections_session_id_fkey(count)
      `)
      .order('created_at', { ascending: false }),
    supabase.from('settings').select('*').eq('id', 1).single(),
  ]);

  interface PostgrestCountRow {
    count: number;
  }

  const sessions: SessionItem[] = (sessionsData || []).map((s: any) => ({
    id: s.id,
    slug: s.slug,
    client_name: s.client_name,
    client_phone: s.client_phone,
    university: s.university,
    graduation_date: s.graduation_date,
    max_selection: s.max_selection,
    status: s.status,
    expires_at: s.expires_at,
    last_synced_at: s.last_synced_at,
    created_at: s.created_at,
    photo_count: (s.photos as PostgrestCountRow[])?.[0]?.count ?? 0,
    selection_count: (s.selections as PostgrestCountRow[])?.[0]?.count ?? 0,
  }));

  const activeSessions = sessions.filter((s) => s.status === 'open').length;
  const submittedSessions = sessions.filter((s) => s.status === 'submitted').length;
  const totalPhotos = sessions.reduce((acc, curr) => acc + curr.photo_count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Dashboard Sesi Foto
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Kelola sesi klien wisuda, pantau pemilihan foto, dan sinkronisasi Google Drive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/sessions/new">
            <Button className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>Buat Sesi Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Sesi
            </p>
            <p className="text-xl font-bold text-stone-900">{sessions.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Sesi Aktif
            </p>
            <p className="text-xl font-bold text-emerald-700">{activeSessions}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Sudah Kirim
            </p>
            <p className="text-xl font-bold text-purple-700">{submittedSessions}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Images className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Foto Sync
            </p>
            <p className="text-xl font-bold text-stone-900">{totalPhotos}</p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">Daftar Sesi Klien</h2>
          <span className="text-xs text-stone-400">
            Menampilkan {sessions.length} sesi terdaftar
          </span>
        </div>

        <SessionTable sessions={sessions} appUrl={appUrl} />
      </section>
    </div>
  );
}
