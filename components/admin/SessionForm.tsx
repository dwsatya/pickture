'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Folder,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Hash,
  Loader2,
  Sparkles,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { createSession } from '@/actions/admin-sessions';

interface SessionFormProps {
  defaultMaxSelection?: number;
}

export function SessionForm({ defaultMaxSelection = 30 }: SessionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [clientName, setClientName] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [maxSelection, setMaxSelection] = useState(defaultMaxSelection);
  const [expiresAt, setExpiresAt] = useState('');
  const [university, setUniversity] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [graduationDate, setGraduationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!clientName.trim()) {
      setErrorMsg('Nama klien wajib diisi.');
      return;
    }

    if (!driveUrl.trim()) {
      setErrorMsg('Link folder Google Drive wajib diisi.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await createSession({
          client_name: clientName,
          drive_url: driveUrl,
          max_selection: Number(maxSelection) || 30,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          university: university || null,
          client_phone: clientPhone || null,
          graduation_date: graduationDate || null,
          notes: notes || null,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Gagal membuat sesi.');
          toast.error(res.error || 'Gagal membuat sesi.');
          return;
        }

        if (res.data) {
          toast.success(
            `Sesi berhasil dibuat! ${res.data.photoCount} foto tersinkronisasi.`
          );
          router.push(`/admin/sessions/${res.data.id}`);
          router.refresh();
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
        setErrorMsg(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <Card className="border-stone-200/90 shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="pb-6 border-b border-stone-100">
        <CardTitle className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <Folder className="h-5 w-5 text-amber-600" />
          <span>Informasi Sesi Klien Baru</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm text-stone-500">
          Masukkan nama klien dan link folder Google Drive. Foto akan otomatis disinkronkan saat sesi disimpan.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6 px-6 sm:px-8">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal Menyimpan Sesi</p>
                <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Section 1: Utama (Wajib) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Data Utama (Wajib)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="clientName" className="text-xs font-semibold text-stone-700">
                  Nama Klien <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="clientName"
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={isPending}
                    required
                    className="pl-9 h-10 rounded-xl bg-stone-50/50 border-stone-200 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maxSelection" className="text-xs font-semibold text-stone-700">
                  Maksimal Foto Terpilih <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="maxSelection"
                    type="number"
                    min="1"
                    placeholder="30"
                    value={maxSelection}
                    onChange={(e) => setMaxSelection(Number(e.target.value))}
                    disabled={isPending}
                    required
                    className="pl-9 h-10 rounded-xl bg-stone-50/50 border-stone-200 focus:bg-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="driveUrl" className="text-xs font-semibold text-stone-700">
                Link Folder Google Drive <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  id="driveUrl"
                  type="text"
                  placeholder="https://drive.google.com/drive/folders/1abc2def3ghi... atau ID folder"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  disabled={isPending}
                  required
                  className="pl-9 h-10 rounded-xl bg-stone-50/50 border-stone-200 focus:bg-white text-sm"
                />
              </div>
              <p className="text-[11px] text-stone-400">
                Pastikan folder ini sudah dibagikan (Viewer) ke akun Google Service Account Anda.
              </p>
            </div>
          </div>

          {/* Section 2: Informasi Tambahan (Opsional) */}
          <div className="space-y-4 pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Informasi Tambahan (Opsional)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="university" className="text-xs font-semibold text-stone-700">
                  Universitas / Kampus
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="university"
                    type="text"
                    placeholder="Contoh: Universitas Indonesia"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    disabled={isPending}
                    className="pl-9 h-10 rounded-xl bg-stone-50/50 border-stone-200 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="clientPhone" className="text-xs font-semibold text-stone-700">
                  No. WhatsApp Klien
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="Contoh: 08123456789"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    disabled={isPending}
                    className="pl-9 h-10 rounded-xl bg-stone-50/50 border-stone-200 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="graduationDate" className="text-xs font-semibold text-stone-700">
                  Tanggal Wisuda
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="graduationDate"
                    type="date"
                    value={graduationDate}
                    onChange={(e) => setGraduationDate(e.target.value)}
                    disabled={isPending}
                    className="pl-9 h-10 rounded-xl bg-stone-50/50 border-stone-200 focus:bg-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiresAt" className="text-xs font-semibold text-stone-700">
                Batas Waktu Pemilihan (Kedaluwarsa)
              </Label>
              <div className="relative max-w-sm">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={isPending}
                  className="pl-9 h-10 rounded-xl bg-stone-50/50 border-stone-200 focus:bg-white text-sm"
                />
              </div>
              <p className="text-[11px] text-stone-400">
                Setelah tanggal ini, link klien otomatis tidak bisa digunakan untuk memilih foto.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-semibold text-stone-700">
                Catatan Khusus (Hanya terlihat fotografer)
              </Label>
              <Textarea
                id="notes"
                placeholder="Contoh: Paket 1 album cetak + 30 foto edit. Klien minta tone warm."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                rows={3}
                className="rounded-xl bg-stone-50/50 border-stone-200 focus:bg-white text-sm"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 pb-8 px-6 sm:px-8 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stone-500">
            {isPending
              ? '⏳ Sedang membaca folder Google Drive dan menyimpan foto ke database...'
              : 'Foto di Google Drive akan langsung disinkronkan otomatis.'}
          </p>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyinkronkan Foto...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Simpan Sesi & Sync Foto</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
