import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/server';
import { connection } from 'next/server';

export async function GET() {
  await connection();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Variabel lingkungan backend belum lengkap.',
      },
      { status: 500 }
    );
  }

  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from('settings').select('id').limit(1);

    if (error) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Koneksi database tidak tersedia.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Sistem beroperasi dengan baik.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Layanan sementara tidak dapat diakses.',
      },
      { status: 500 }
    );
  }
}
