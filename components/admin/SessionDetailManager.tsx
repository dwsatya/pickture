'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Lock,
  Unlock,
  Trash2,
  Edit,
  Loader2,
  AlertTriangle,
  FolderOpen,
  Calendar,
  Clock,
  Save,
} from 'lucide-react';
import {
  syncSession,
  unlockSession,
  closeSession,
  deleteSession,
  updateSession,
} from '@/actions/admin-sessions';
import { SessionStatus } from '@/lib/supabase/types';

interface SessionData {
  id: string;
  slug: string;
  client_name: string;
  client_phone: string | null;
  university: string | null;
  graduation_date: string | null;
  drive_folder_id: string;
  max_selection: number;
  status: SessionStatus;
  expires_at: string | null;
  notes: string | null;
  last_synced_at: string | null;
  created_at: string | null;
}

interface SessionDetailManagerProps {
  session: SessionData;
}

export function SessionDetailManager({ session }: SessionDetailManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Edit form state
  const [clientName, setClientName] = useState(session.client_name);
  const [maxSelection, setMaxSelection] = useState(session.max_selection);
  const [status, setStatus] = useState<SessionStatus>(session.status);
  const [expiresAt, setExpiresAt] = useState(
    session.expires_at ? session.expires_at.substring(0, 16) : ''
  );
  const [university, setUniversity] = useState(session.university || '');
  const [clientPhone, setClientPhone] = useState(session.client_phone || '');
  const [graduationDate, setGraduationDate] = useState(session.graduation_date || '');
  const [notes, setNotes] = useState(session.notes || '');

  // 1. Handle Sync
  const handleSync = () => {
    startTransition(async () => {
      try {
        const res = await syncSession(session.id);
        if (res.success && res.data) {
          toast.success(`Sinkronisasi berhasil! ${res.data.count} foto terupdate.`);
          router.refresh();
        } else {
          toast.error(res.error || 'Gagal menyinkronkan foto.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        toast.error(msg);
      }
    });
  };

  // 2. Handle Unlock (submitted -> open)
  const handleUnlock = () => {
    startTransition(async () => {
      try {
        const res = await unlockSession(session.id);
        if (res.success) {
          toast.success('Sesi berhasil dibuka kembali untuk klien.');
          router.refresh();
        } else {
          toast.error(res.error || 'Gagal membuka kunci sesi.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        toast.error(msg);
      }
    });
  };

  // 3. Handle Close Session
  const handleClose = () => {
    startTransition(async () => {
      try {
        const res = await closeSession(session.id);
        if (res.success) {
          toast.success('Sesi berhasil ditutup.');
          router.refresh();
        } else {
          toast.error(res.error || 'Gagal menutup sesi.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        toast.error(msg);
      }
    });
  };

  // 4. Handle Delete
  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await deleteSession(session.id);
        if (res.success) {
          toast.success('Sesi berhasil dihapus.');
          router.push('/admin');
          router.refresh();
        } else {
          toast.error(res.error || 'Gagal menghapus sesi.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        toast.error(msg);
      }
    });
  };

  // 5. Handle Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await updateSession(session.id, {
          client_name: clientName,
          max_selection: Number(maxSelection) || 30,
          status,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          university: university || null,
          client_phone: clientPhone || null,
          graduation_date: graduationDate || null,
          notes: notes || null,
        });

        if (res.success) {
          toast.success('Perubahan sesi berhasil disimpan.');
          setIsEditOpen(false);
          router.refresh();
        } else {
          toast.error(res.error || 'Gagal menyimpan perubahan.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
        toast.error(msg);
      }
    });
  };

  return (
    <>
      {/* Action buttons bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isPending}
          className="h-9 px-3 text-xs rounded-xl border-stone-200 hover:bg-stone-100 flex items-center gap-1.5 cursor-pointer font-semibold"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 text-stone-600" />
          )}
          <span>Sync Ulang Drive</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditOpen(true)}
          disabled={isPending}
          className="h-9 px-3 text-xs rounded-xl border-stone-200 hover:bg-stone-100 flex items-center gap-1.5 cursor-pointer font-semibold"
        >
          <Edit className="h-3.5 w-3.5 text-stone-600" />
          <span>Edit Sesi</span>
        </Button>

        {session.status === 'submitted' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnlock}
            disabled={isPending}
            className="h-9 px-3 text-xs rounded-xl border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 flex items-center gap-1.5 cursor-pointer font-semibold"
            title="Buka kembali sesi agar klien bisa merevisi foto"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>Buka Kunci</span>
          </Button>
        )}

        {session.status === 'open' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isPending}
            className="h-9 px-3 text-xs rounded-xl border-stone-200 text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            <Lock className="h-3.5 w-3.5 text-stone-500" />
            <span>Tutup Sesi</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteOpen(true)}
          disabled={isPending}
          className="h-9 px-3 text-xs rounded-xl border-stone-200 text-red-600 hover:bg-red-50 hover:border-red-200 flex items-center gap-1.5 cursor-pointer font-semibold"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
          <span>Hapus</span>
        </Button>
      </div>

      {/* Edit Session Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-stone-900">
              Edit Data Sesi
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              Ubah rincian sesi, batas maksimal pemilihan foto, atau status sesi.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="editClientName" className="text-xs font-semibold text-stone-700">
                Nama Klien
              </Label>
              <Input
                id="editClientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
                className="h-10 rounded-xl bg-stone-50 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editMax" className="text-xs font-semibold text-stone-700">
                  Maksimal Pilihan
                </Label>
                <Input
                  id="editMax"
                  type="number"
                  min="1"
                  value={maxSelection}
                  onChange={(e) => setMaxSelection(Number(e.target.value))}
                  required
                  className="h-10 rounded-xl bg-stone-50 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editStatus" className="text-xs font-semibold text-stone-700">
                  Status Sesi
                </Label>
                <select
                  id="editStatus"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SessionStatus)}
                  className="w-full h-10 rounded-xl bg-stone-50 border border-stone-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="open">Aktif (Open)</option>
                  <option value="submitted">Terkirim (Submitted)</option>
                  <option value="closed">Ditutup (Closed)</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editUniv" className="text-xs font-semibold text-stone-700">
                  Kampus / Universitas
                </Label>
                <Input
                  id="editUniv"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="h-10 rounded-xl bg-stone-50 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editPhone" className="text-xs font-semibold text-stone-700">
                  No. WhatsApp Klien
                </Label>
                <Input
                  id="editPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="h-10 rounded-xl bg-stone-50 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="editGrad" className="text-xs font-semibold text-stone-700">
                  Tanggal Wisuda
                </Label>
                <Input
                  id="editGrad"
                  type="date"
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className="h-10 rounded-xl bg-stone-50 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="editExpires" className="text-xs font-semibold text-stone-700">
                  Batas Kedaluwarsa
                </Label>
                <Input
                  id="editExpires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-10 rounded-xl bg-stone-50 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editNotes" className="text-xs font-semibold text-stone-700">
                Catatan Internal
              </Label>
              <Textarea
                id="editNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl bg-stone-50 text-sm"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isPending}
                className="rounded-xl text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs flex items-center gap-1.5"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Simpan Perubahan</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-stone-900">
              Hapus Sesi {session.client_name}?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Seluruh data foto yang tersimpan, seleksi klien, dan riwayat kirim untuk sesi ini akan dihapus dari database. File asli di Google Drive Anda tetap aman dan tidak akan terhapus.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isPending}
              className="rounded-xl text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs flex items-center gap-1.5"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>Ya, Hapus Sesi</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
