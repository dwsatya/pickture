import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/supabase/auth';
import { connection } from 'next/server';

export const instant = false;

export default async function RootPage() {
  await connection();
  const user = await getAdminUser();
  if (user) {
    redirect('/admin');
  }
  redirect('/admin/login');
}
