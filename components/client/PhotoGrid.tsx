'use client';

import { useState, useTransition } from 'react';
import { PhotoData, PhotoCard } from '@/components/client/PhotoCard';
import { Lightbox } from '@/components/client/Lightbox';
import { SelectionBar } from '@/components/client/SelectionBar';
import { SubmitDialog } from '@/components/client/SubmitDialog';
import { toggleSelection } from '@/actions/client-selection';
import { toast } from 'sonner';
import {
  GraduationCap,
  Sparkles,
  Images,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface PhotoGridProps {
  slug: string;
  clientName: string;
  university?: string | null;
  maxSelection: number;
  initialPhotos: PhotoData[];
  initialSelectedIds: string[];
}

export function PhotoGrid({
  slug,
  clientName,
  university,
  maxSelection,
  initialPhotos,
  initialSelectedIds,
}: PhotoGridProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [activeFilter, setActiveFilter] = useState<'all' | 'selected'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submittedWaUrl, setSubmittedWaUrl] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const selectedCount = selectedIds.length;
  const isMaxReached = selectedCount >= maxSelection;

  // Filtered photos
  const displayedPhotos =
    activeFilter === 'selected'
      ? initialPhotos.filter((p) => selectedIds.includes(p.id))
      : initialPhotos;

  const selectedPhotoObjects = initialPhotos.filter((p) => selectedIds.includes(p.id));

  // Toggle selection with Optimistic UI & Server RPC
  const handleToggle = (photoId: string) => {
    const isCurrentlySelected = selectedIds.includes(photoId);

    if (!isCurrentlySelected && isMaxReached) {
      toast.warning(`Batas maksimal tercapai (${maxSelection} foto). Batalkan pilihan lain terlebih dahulu.`);
      return;
    }

    // 1. Optimistic Update
    const nextSelectedIds = isCurrentlySelected
      ? selectedIds.filter((id) => id !== photoId)
      : [...selectedIds, photoId];

    setSelectedIds(nextSelectedIds);

    // 2. Server Action RPC
    startTransition(async () => {
      try {
        const res = await toggleSelection(slug, photoId);
        if (!res.ok) {
          // Rollback if server rejects (e.g. race condition or closed session)
          setSelectedIds(selectedIds);
          if (res.error === 'MAX_REACHED') {
            toast.error(`Batas maksimal ${maxSelection} foto telah tercapai.`);
          } else if (res.error === 'SESSION_CLOSED') {
            toast.error('Sesi pemilihan foto sudah ditutup.');
          } else {
            toast.error(res.error || 'Gagal menyimpan pilihan.');
          }
        }
      } catch (err: unknown) {
        // Rollback
        setSelectedIds(selectedIds);
        const msg = err instanceof Error ? err.message : 'Koneksi gagal.';
        toast.error(msg);
      }
    });
  };

  // Open Lightbox
  const handleZoom = (photo: PhotoData) => {
    const idx = displayedPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) {
      setLightboxIndex(idx);
    }
  };

  // If already submitted in this session
  if (submittedWaUrl) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl text-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Terima Kasih, {clientName}!
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Pilihan <strong>{selectedCount} foto</strong> Anda sudah berhasil tersimpan di sistem kami.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <a
              href={submittedWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all"
            >
              <MessageCircle className="h-5 w-5" />
              <span>Buka WhatsApp Lagi</span>
              <ExternalLink className="h-4 w-4 ml-0.5" />
            </a>

            <p className="text-xs text-stone-400">
              Jika aplikasi WhatsApp tidak otomatis terbuka, silakan klik tombol di atas untuk mengirimkan daftar foto ke fotografer.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 select-none">
      {/* Sticky Compact Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/picture.png"
              alt="Pickture"
              width={996}
              height={376}
              priority
              className="h-7 sm:h-8 w-auto object-contain hidden sm:block"
            />
            <div className="hidden sm:block h-6 w-px bg-stone-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-stone-900 text-base sm:text-lg tracking-tight">
                  {clientName}
                </h1>
                {university && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    <GraduationCap className="h-3 w-3 text-amber-600" />
                    <span>{university}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Pilih maksimal <span className="font-bold text-amber-600">{maxSelection} foto</span> favorit Anda
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Semua ({initialPhotos.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('selected')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === 'selected'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <span>Dipilih</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeFilter === 'selected' ? 'bg-amber-700 text-white' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {selectedCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Gallery Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {displayedPhotos.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Images className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-stone-800 text-base">
              {activeFilter === 'selected'
                ? 'Belum Ada Foto yang Dipilih'
                : 'Foto Belum Tersedia'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {activeFilter === 'selected'
                ? 'Ketuk pada foto mana saja untuk memilihnya ke dalam daftar pilihan Anda.'
                : 'Foto belum diunggah atau masih dalam proses oleh fotografer.'}
            </p>
            {activeFilter === 'selected' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveFilter('all')}
                className="rounded-xl text-xs font-semibold mt-2"
              >
                Tampilkan Semua Foto
              </Button>
            )}
          </div>
        ) : (
          /* Responsive Grid: 2 cols on mobile, 3-4 on tablet, 5-6 on desktop */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4">
            {displayedPhotos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isSelected={selectedIds.includes(photo.id)}
                onToggle={handleToggle}
                onZoom={handleZoom}
                disabled={isMaxReached}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <SelectionBar
        selectedCount={selectedCount}
        maxSelection={maxSelection}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onSubmitClick={() => setIsSubmitOpen(true)}
      />

      {/* Lightbox Modal */}
      <Lightbox
        photos={displayedPhotos}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        selectedPhotoIds={selectedIds}
        onToggle={handleToggle}
        maxReached={isMaxReached}
      />

      {/* Submit Confirmation Dialog */}
      <SubmitDialog
        slug={slug}
        clientName={clientName}
        selectedPhotos={selectedPhotoObjects}
        maxSelection={maxSelection}
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSuccess={(waUrl) => setSubmittedWaUrl(waUrl)}
      />
    </div>
  );
}
