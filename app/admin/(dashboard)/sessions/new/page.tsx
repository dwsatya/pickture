import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase/auth';
import { getAdminClient } from '@/lib/supabase/server';
import { SessionForm } from '@/components/admin/SessionForm';
import { ArrowLeft } from 'lucide-react';

import { connection } from 'next/server';

export const instant = false;

export default async function NewSessionPage() {
  await connection();
  await requireAdmin();
  const supabase = getAdminClient();

  const { data: settings } = await supabase
    .from('settings')
    .select('default_max_selection')
    .eq('id', 1)
    .single();

  const defaultMax = settings?.default_max_selection ?? 30;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-200/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      <SessionForm defaultMaxSelection={defaultMax} />
    </div>
  );
}
