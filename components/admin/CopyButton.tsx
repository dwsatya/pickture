'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
  text: string;
  label?: string;
  toastMessage?: string;
  variant?: 'outline' | 'default' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function CopyButton({
  text,
  label = 'Salin Link',
  toastMessage = 'Tautan berhasil disalin!',
  variant = 'outline',
  size = 'sm',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(toastMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin ke clipboard.');
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`text-xs h-8 px-2.5 rounded-lg border-stone-200 transition-colors flex items-center gap-1.5 cursor-pointer ${className}`}
      title={text}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          {label && <span className="text-emerald-700 font-medium">Tersalin!</span>}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-stone-500" />
          {label && <span>{label}</span>}
        </>
      )}
    </Button>
  );
}
