'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { logoutAction } from '@/actions/admin-auth';

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
      className="text-xs h-9 px-3 rounded-lg border-stone-200 text-stone-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      <span>{isPending ? 'Keluar...' : 'Keluar'}</span>
    </Button>
  );
}
