import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/supabase/auth';
import { getAdminClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CopyButton } from '@/components/admin/CopyButton';
import { SessionDetailManager } from '@/components/admin/SessionDetailManager';
import { formatPhotoCodes } from '@/lib/format-codes';
import {
  ArrowLeft,
  GraduationCap,
  Calendar,
  Phone,
  Clock,
  Images,
  CheckCircle2,
  ExternalLink,
  Folder,
  Send,
  History,
  FileText,
  Search,
} from 'lucide-react';

import { connection } from 'next/server';

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  await connection();
  await requireAdmin();
  const { id } = await params;
  const supabase = getAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 1. Fetch Session
  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (!session) {
    notFound();
  }

  // 2. Fetch Photos
  const { data: photos } = await supabase
    .from('photos')
    .select('id, file_name, code, sort_order, width, height')
    .eq('session_id', id)
    .order('sort_order', { ascending: true });

  // 3. Fetch Current Selections
  const { data: selections } = await supabase
    .from('selections')
    .select('photo_id, photos(code, file_name)')
    .eq('session_id', id);

  // 4. Fetch Submissions History
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('session_id', id)
    .order('submitted_at', { ascending: false });

  // 5. Fetch Settings
  const { data: settings } = await supabase
    .from('settings')
    .select('code_separator')
    .eq('id', 1)
    .single();

  const separator = settings?.code_separator || ' OR ';
  const selectedPhotoCodes: string[] = (selections || [])
    .map((s: any) => s.photos?.code)
    .filter(Boolean);

  const formattedSearchCodes = formatPhotoCodes(selectedPhotoCodes, separator);
  const clientUrl = `${appUrl}/p/${session.slug}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-200/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Daftar Sesi</span>
        </Link>

        <a
          href={clientUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200"
        >
          <span>Preview Halaman Klien</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Session Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-stone-100">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                {session.client_name}
              </h1>
              <StatusBadge status={session.status} />
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-500">
              {session.university && (
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <GraduationCap className="h-4 w-4 text-amber-600" />
                  <span>{session.university}</span>
                </span>
              )}
              {session.client_phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  <span>{session.client_phone}</span>
                </span>
              )}
              {session.graduation_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-stone-400" />
                  <span>
                    Wisuda:{' '}
                    {new Date(session.graduation_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Action buttons (Sync, Edit, Unlock, Close, Delete) */}
          <SessionDetailManager session={session} />
        </div>

        {/* Link Klien Bar */}
        <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Tautan Pemilihan Foto Klien
            </p>
            <p className="font-mono text-xs sm:text-sm text-stone-800 break-all select-all font-medium">
              {clientUrl}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton
              text={clientUrl}
              label="Salin Tautan Klien"
              toastMessage={`Link pemilihan klien ${session.client_name} berhasil disalin!`}
              className="bg-white hover:bg-stone-100"
            />
          </div>
        </div>

        {session.notes && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/70 text-xs text-stone-700">
            <p className="font-semibold text-amber-900 flex items-center gap-1.5 mb-0.5">
              <FileText className="h-3.5 w-3.5 text-amber-700" />
              <span>Catatan Fotografer:</span>
            </p>
            <p className="leading-relaxed whitespace-pre-wrap">{session.notes}</p>
          </div>
        )}
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Total Foto Sync
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-stone-900">{photos?.length ?? 0}</span>
            <span className="text-xs text-stone-400">foto</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Foto Dipilih Klien
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-2xl font-bold ${
                (selections?.length ?? 0) >= session.max_selection
                  ? 'text-emerald-600'
                  : 'text-stone-900'
              }`}
            >
              {selections?.length ?? 0}
            </span>
            <span className="text-xs text-stone-400">/ {session.max_selection} maks</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Status Kedaluwarsa
          </p>
          <p className="text-xs font-semibold text-stone-800 mt-2 truncate">
            {session.expires_at ? (
              new Date(session.expires_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            ) : (
              <span className="text-stone-400 font-normal">Tidak terbatas</span>
            )}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
            Terakhir Disync
          </p>
          <p className="text-xs font-semibold text-stone-800 mt-2 truncate">
            {session.last_synced_at ? (
              new Date(session.last_synced_at).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }) +
              ' WIB (' +
              new Date(session.last_synced_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              }) +
              ')'
            ) : (
              <span className="text-stone-400 font-normal">Belum disync</span>
            )}
          </p>
        </div>
      </div>

      {/* Selected Photo Codes Section (Windows File Explorer Ready) */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-600" />
              <span>Kode Foto Terpilih (Windows File Explorer)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Copy kode ini lalu paste di kolom pencarian Windows Explorer untuk memfilter semua foto pilihan klien sekaligus.
            </p>
          </div>

          {formattedSearchCodes && (
            <CopyButton
              text={formattedSearchCodes}
              label="Salin Kode Pencarian"
              toastMessage="Daftar kode foto berhasil disalin!"
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold self-start sm:self-auto"
            />
          )}
        </div>

        {formattedSearchCodes ? (
          <div className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto select-all border border-stone-800">
            {formattedSearchCodes}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-400">
            Klien belum memilih foto untuk sesi ini.
          </div>
        )}
      </div>

      {/* Riwayat Submission (Jika ada) */}
      {submissions && submissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <History className="h-4 w-4 text-stone-600" />
            <span>Riwayat Pengiriman Klien ({submissions.length})</span>
          </h2>

          <div className="divide-y divide-stone-100">
            {submissions.map((sub, idx) => (
              <div
                key={sub.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-semibold text-stone-800">
                    Pengiriman #{submissions.length - idx}
                  </span>
                  <span className="text-stone-400 ml-2">
                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('id-ID') : '-'}
                  </span>
                  <p className="text-stone-500 mt-0.5">
                    Memilih {sub.photo_count} foto
                  </p>
                </div>
                <CopyButton
                  text={sub.photo_codes.join(separator)}
                  label="Salin Kode Ini"
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Synced Photos List */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Images className="h-4 w-4 text-stone-700" />
              <span>Daftar Foto Tersinkron ({photos?.length ?? 0} foto)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Urutan natural sort berdasarkan nama file Google Drive.
            </p>
          </div>
        </div>

        {photos && photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-h-[500px] overflow-y-auto p-1">
            {photos.map((p, idx) => {
              const isSelected = selectedPhotoCodes.includes(p.code);
              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <p className="font-bold text-stone-900 text-xs font-mono truncate" title={p.code}>
                    {p.code}
                  </p>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5" title={p.file_name}>
                    {p.file_name}
                  </p>
                  <span className="text-[9px] text-stone-400 mt-1 block">#{idx + 1}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-stone-50 border border-stone-200 text-center text-xs text-stone-400">
            Belum ada foto tersinkron. Klik tombol <strong>Sync Ulang Drive</strong> di atas.
          </div>
        )}
      </div>
    </div>
  );
}
