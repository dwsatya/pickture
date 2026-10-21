'use client';

import { Button } from '@/components/ui/button';
import { Send, Eye, CheckCircle2 } from 'lucide-react';

interface SelectionBarProps {
  selectedCount: number;
  maxSelection: number;
  activeFilter: 'all' | 'selected';
  onFilterChange: (filter: 'all' | 'selected') => void;
  onSubmitClick: () => void;
}

export function SelectionBar({
  selectedCount,
  maxSelection,
  activeFilter,
  onFilterChange,
  onSubmitClick,
}: SelectionBarProps) {
  const isMax = selectedCount >= maxSelection;
  const progressPercent = Math.min(100, Math.round((selectedCount / maxSelection) * 100));

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 p-3 sm:p-4 bg-gradient-to-t from-stone-900/40 via-stone-900/10 to-transparent pointer-events-none">
      <div className="max-w-xl mx-auto bg-stone-900/95 text-white backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-2xl border border-stone-800 flex items-center justify-between gap-3 pointer-events-auto">
        {/* Selection Counter & Filter */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono font-bold text-base sm:text-lg ${
                  isMax ? 'text-amber-400' : 'text-white'
                }`}
              >
                {selectedCount}
              </span>
              <span className="text-stone-400 text-xs sm:text-sm font-medium">
                / {maxSelection} dipilih
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-24 sm:w-32 h-1.5 bg-stone-800 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isMax ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="hidden xs:flex items-center bg-stone-800/90 rounded-xl p-0.5 border border-stone-700/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-stone-700 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('selected')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'selected'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Dipilih</span>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="button"
          onClick={onSubmitClick}
          disabled={selectedCount === 0}
          className={`h-11 px-5 sm:px-6 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer ${
            selectedCount > 0
              ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold shadow-amber-500/20'
              : 'bg-stone-800 text-stone-500 cursor-not-allowed'
          }`}
        >
          <span>Kirim</span>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
