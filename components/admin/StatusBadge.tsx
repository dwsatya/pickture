import { Badge } from '@/components/ui/badge';
import { SessionStatus } from '@/lib/supabase/types';

interface StatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  switch (status) {
    case 'open':
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-700 border-emerald-200/90 font-medium ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
          Aktif (Open)
        </Badge>
      );
    case 'submitted':
      return (
        <Badge
          variant="outline"
          className={`bg-blue-50 text-blue-700 border-blue-200/90 font-medium ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-1.5" />
          Terkirim (Submitted)
        </Badge>
      );
    case 'closed':
      return (
        <Badge
          variant="outline"
          className={`bg-stone-100 text-stone-600 border-stone-200 font-medium ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-stone-400 mr-1.5" />
          Ditutup (Closed)
        </Badge>
      );
    case 'draft':
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-200/90 font-medium ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5" />
          Draft
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
