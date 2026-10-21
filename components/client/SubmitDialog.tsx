'use client';

import { useState, useTransition } from 'react';
import { PhotoData } from '@/components/client/PhotoCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { submitSelection } from '@/actions/client-selection';
import { toast } from 'sonner';

interface SubmitDialogProps {
  slug: string;
  clientName: string;
  selectedPhotos: PhotoData[];
  maxSelection: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (whatsappUrl: string) => void;
}

export function SubmitDialog({
  slug,
  clientName,
  selectedPhotos,
  maxSelection,
  isOpen,
  onClose,
  onSuccess,
}: SubmitDialogProps) {
  const [isPending, startTransition] = useTransition();
  const count = selectedPhotos.length;

  const handleConfirmSubmit = () => {
    startTransition(async () => {
      try {
        const res = await submitSelection(slug);
        if (!res.success || !res.whatsappUrl) {
          toast.error(res.error || 'Gagal mengirim pilihan foto.');
          return;
        }

        toast.success('Pilihan berhasil disimpan!');

        // Try opening WhatsApp
        window.open(res.whatsappUrl, '_blank');

        // Transition UI state
        onSuccess(res.whatsappUrl);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kendala sistem.';
        toast.error(msg);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isPending && !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8">
        <DialogHeader className="text-left space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
            <MessageSquare className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-extrabold text-stone-900 tracking-tight">
            Kirim {count} Foto Terpilih?
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-stone-500 leading-relaxed">
            Pilihan Anda akan disimpan dan sesi akan dikunci. Selanjutnya, aplikasi akan membuka WhatsApp fotografer secara otomatis dengan daftar kode foto yang telah Anda pilih.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Photos Thumbnails Preview */}
        <div className="space-y-2 my-2">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
            <span>Daftar Foto ({count} foto)</span>
            <span>Batas: {maxSelection}</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-stone-50 border border-stone-200/80">
            {selectedPhotos.map((p) => (
              <div
                key={p.id}
                className="aspect-[2/3] rounded-lg overflow-hidden bg-stone-200 relative group"
              >
                <img
                  src={`/api/img/${p.drive_file_id}?size=400`}
                  alt={p.code}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-center">
                  <span className="font-mono text-[9px] text-white truncate block">
                    {p.code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto h-11 px-5 rounded-xl text-xs font-semibold"
          >
            Kembali Memilih
          </Button>

          <Button
            type="button"
            onClick={handleConfirmSubmit}
            disabled={isPending}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan & Membuka WA...</span>
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                <span>Ya, Kirim ke WhatsApp</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
