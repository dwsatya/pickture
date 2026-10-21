'use client';

import { useEffect, useCallback } from 'react';
import { PhotoData } from '@/components/client/PhotoCard';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface LightboxProps {
  photos: PhotoData[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  selectedPhotoIds: string[];
  onToggle: (photoId: string) => void;
  maxReached: boolean;
}

export function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  selectedPhotoIds,
  onToggle,
  maxReached,
}: LightboxProps) {
  const isOpen = currentIndex !== null && currentIndex >= 0 && currentIndex < photos.length;
  const currentPhoto = isOpen ? photos[currentIndex] : null;
  const isSelected = currentPhoto ? selectedPhotoIds.includes(currentPhoto.id) : false;

  const handlePrev = useCallback(() => {
    if (currentIndex !== null && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex !== null && currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const imgSrc = `/api/img/${currentPhoto.drive_file_id}?size=1600`;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wide">
            {currentPhoto.code}
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            Foto {currentIndex + 1} dari {photos.length}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Tutup (Esc)"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Image Area with Left/Right Buttons */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-10 h-11 w-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
            title="Foto Sebelumnya (Panah Kiri)"
            aria-label="Foto Sebelumnya"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* High-res Image */}
        <div className="max-h-full max-w-full flex items-center justify-center">
          <img
            src={imgSrc}
            alt={currentPhoto.code}
            decoding="async"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="max-h-[75vh] sm:max-h-[80vh] max-w-[95vw] sm:max-w-[85vw] object-contain rounded-lg shadow-2xl transition-opacity"
          />
        </div>

        {/* Next Button */}
        {currentIndex < photos.length - 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-10 h-11 w-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
            title="Foto Selanjutnya (Panah Kanan)"
            aria-label="Foto Selanjutnya"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Bottom Floating Bar */}
      <div className="p-4 sm:p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent z-10">
        <Button
          type="button"
          size="lg"
          onClick={() => {
            if (!maxReached || isSelected) {
              onToggle(currentPhoto.id);
            }
          }}
          disabled={maxReached && !isSelected}
          className={`h-12 px-8 rounded-full font-bold text-sm shadow-xl transition-all flex items-center gap-2 cursor-pointer ${
            isSelected
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-white/50'
              : 'bg-white text-stone-900 hover:bg-stone-100'
          }`}
        >
          <div
            className={`h-5 w-5 rounded-full flex items-center justify-center ${
              isSelected ? 'bg-white text-amber-600' : 'border-2 border-stone-400'
            }`}
          >
            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </div>
          <span>{isSelected ? 'Foto Terpilih' : 'Pilih Foto Ini'}</span>
        </Button>
      </div>
    </div>
  );
}
