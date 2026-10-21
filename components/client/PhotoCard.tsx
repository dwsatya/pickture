'use client';

import { Check, ZoomIn } from 'lucide-react';

export interface PhotoData {
  id: string;
  drive_file_id: string;
  file_name: string;
  code: string;
  width: number | null;
  height: number | null;
  sort_order: number;
}

interface PhotoCardProps {
  photo: PhotoData;
  isSelected: boolean;
  onToggle: (photoId: string) => void;
  onZoom: (photo: PhotoData) => void;
  disabled?: boolean;
}

export function PhotoCard({
  photo,
  isSelected,
  onToggle,
  onZoom,
  disabled = false,
}: PhotoCardProps) {
  const imgSrc = `/api/img/${photo.drive_file_id}?size=600`;

  return (
    <div
      onClick={() => {
        if (!disabled || isSelected) {
          onToggle(photo.id);
        }
      }}
      className={`group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-200 transform ${
        isSelected
          ? 'ring-3 ring-amber-500 shadow-md ring-offset-2 scale-[0.98]'
          : 'hover:shadow-lg hover:scale-[1.01] bg-stone-100'
      } ${disabled && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Photo Image */}
      <img
        src={imgSrc}
        alt={photo.code}
        loading="lazy"
        decoding="async"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
      />

      {/* Selected Overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-amber-950/20 backdrop-brightness-95 pointer-events-none" />
      )}

      {/* Selection Checkmark Badge */}
      <div
        className={`absolute top-2 left-2 h-7 w-7 rounded-full flex items-center justify-center transition-all shadow-md ${
          isSelected
            ? 'bg-amber-500 text-white scale-100'
            : 'bg-white/80 backdrop-blur-xs text-transparent hover:text-stone-400 group-hover:bg-white scale-90'
        }`}
      >
        <Check className="h-4 w-4 stroke-[3]" />
      </div>

      {/* Zoom / Lightbox Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onZoom(photo);
        }}
        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-md cursor-pointer"
        title="Perbesar foto"
        aria-label="Perbesar foto"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>

      {/* Photo Code Label */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 pt-6 text-left pointer-events-none">
        <span className="font-mono text-[11px] font-bold text-white tracking-wide truncate block drop-shadow-sm">
          {photo.code}
        </span>
      </div>
    </div>
  );
}
