'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CopyButton } from '@/components/admin/CopyButton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FolderKanban,
  ExternalLink,
  RefreshCw,
  Plus,
  Calendar,
  Clock,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { syncSession } from '@/actions/admin-sessions';

export interface SessionItem {
  id: string;
  slug: string;
  client_name: string;
  client_phone: string | null;
  university: string | null;
  graduation_date: string | null;
  max_selection: number;
  status: 'draft' | 'open' | 'submitted' | 'closed';
  expires_at: string | null;
  last_synced_at: string | null;
  created_at: string | null;
  photo_count: number;
  selection_count: number;
}

interface SessionTableProps {
  sessions: SessionItem[];
  appUrl: string;
}

export function SessionTable({ sessions, appUrl }: SessionTableProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSync = (sessionId: string, clientName: string) => {
    setSyncingId(sessionId);
    startTransition(async () => {
      try {
        const res = await syncSession(sessionId);
        if (res.success && res.data) {
          toast.success(
            `Sync selesai untuk "${clientName}": ${res.data.count} foto terupdate.`
          );
        } else {
          toast.error(res.error || 'Gagal menyinkronkan foto.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
        toast.error(msg);
      } finally {
        setSyncingId(null);
      }
    });
  };

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="max-w-md mx-auto space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <FolderKanban className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-stone-900">Belum Ada Sesi Klien</h2>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            Mulai dengan menambahkan sesi foto wisuda pertama Anda. Masukkan link folder Google Drive untuk menyinkronkan foto.
          </p>
          <div className="pt-2">
            <Link href="/admin/sessions/new">
              <Button className="h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md shadow-amber-600/20 inline-flex items-center gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" />
                <span>Buat Sesi Pertama</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-stone-50/80 border-b border-stone-200 text-stone-700">
            <TableRow>
              <TableHead className="py-3.5 px-4 sm:px-6 text-xs font-bold text-stone-600">
                Klien
              </TableHead>
              <TableHead className="py-3.5 px-3 text-xs font-bold text-stone-600">
                Status
              </TableHead>
              <TableHead className="py-3.5 px-3 text-xs font-bold text-stone-600 text-center">
                Total Foto
              </TableHead>
              <TableHead className="py-3.5 px-3 text-xs font-bold text-stone-600 text-center">
                Pilihan
              </TableHead>
              <TableHead className="py-3.5 px-3 text-xs font-bold text-stone-600">
                Kedaluwarsa
              </TableHead>
              <TableHead className="py-3.5 px-3 text-xs font-bold text-stone-600 text-center">
                Link Klien
              </TableHead>
              <TableHead className="py-3.5 px-4 sm:px-6 text-xs font-bold text-stone-600 text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-stone-100">
            {sessions.map((session) => {
              const clientUrl = `${appUrl}/p/${session.slug}`;
              const isSyncingThis = syncingId === session.id;

              return (
                <TableRow
                  key={session.id}
                  className="hover:bg-amber-50/30 transition-colors"
                >
                  {/* Klien */}
                  <TableCell className="py-3.5 px-4 sm:px-6">
                    <div className="font-semibold text-stone-900 text-sm">
                      <Link
                        href={`/admin/sessions/${session.id}`}
                        className="hover:text-amber-600 transition-colors"
                      >
                        {session.client_name}
                      </Link>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-stone-500">
                      {session.university && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3 text-stone-400" />
                          <span>{session.university}</span>
                        </span>
                      )}
                      {session.client_phone && (
                        <span className="text-stone-400">&bull; {session.client_phone}</span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-3.5 px-3 whitespace-nowrap">
                    <StatusBadge status={session.status} />
                  </TableCell>

                  {/* Total Foto */}
                  <TableCell className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span className="font-semibold text-stone-800 text-xs">
                      {session.photo_count} foto
                    </span>
                  </TableCell>

                  {/* Pilihan / Kuota */}
                  <TableCell className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                        session.selection_count >= session.max_selection
                          ? 'bg-emerald-100 text-emerald-800'
                          : session.selection_count > 0
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {session.selection_count} / {session.max_selection}
                    </span>
                  </TableCell>

                  {/* Kedaluwarsa */}
                  <TableCell className="py-3.5 px-3 text-xs text-stone-500 whitespace-nowrap">
                    {session.expires_at ? (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3 text-stone-400 shrink-0" />
                        <span>
                          {new Date(session.expires_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    ) : (
                      <span className="text-stone-400">&mdash;</span>
                    )}
                  </TableCell>

                  {/* Link Klien */}
                  <TableCell className="py-3.5 px-3 text-center whitespace-nowrap">
                    <CopyButton
                      text={clientUrl}
                      label="Copy Link"
                      toastMessage={`Link pemilihan foto ${session.client_name} disalin!`}
                    />
                  </TableCell>

                  {/* Aksi */}
                  <TableCell className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleSync(session.id, session.client_name)}
                        className="h-8 px-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs rounded-lg cursor-pointer"
                        title="Sync ulang folder Google Drive"
                      >
                        {isSyncingThis ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                        ) : (
                          <RefreshCw className="h-3.5 w-3.5" />
                        )}
                      </Button>

                      <Link href={`/admin/sessions/${session.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs rounded-lg border-stone-200 hover:bg-stone-100 font-semibold text-stone-800 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Buka</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
