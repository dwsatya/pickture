import { notFound } from 'next/navigation';
import { getClientSession } from '@/actions/client-selection';
import { PhotoGrid } from '@/components/client/PhotoGrid';
import { CheckCircle2, Lock, Clock, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const res = await getClientSession(slug);
  if (!res.valid || !res.session) {
    return { title: 'Pemilihan Foto Wisuda' };
  }

  return {
    title: `Pickture by NayakaVisuals - ${res.session.client_name}`,
    description: `Pilih maksimal ${res.session.max_selection} foto wisuda favorit Anda.`,
  };
}

export default async function ClientPhotoSelectionPage({ params }: PageProps) {
  const { slug } = await params;
  const res = await getClientSession(slug);

  // 1. Slug tidak ditemukan di database -> 404
  if (!res.valid && res.reason === 'NOT_FOUND') {
    notFound();
  }

  // 2. Status 'submitted' -> Tampilkan halaman ramah
  if (!res.valid && res.reason === 'SUBMITTED' && res.session) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-6">
        <header className="max-w-xl mx-auto w-full pt-4">
          <Image
            src="/picture.png"
            alt="Pickture"
            width={996}
            height={376}
            priority
            className="h-8 w-auto object-contain"
          />
        </header>

        <main className="max-w-md mx-auto w-full my-8 bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Pilihan Sudah Terkirim
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Halo <strong>{res.session.client_name}</strong>, pilihan foto Anda sudah berhasil terkirim dan disimpan oleh fotografer.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-500 leading-relaxed">
            Jika Anda ingin mengubah atau merevisi pilihan foto, silakan hubungi fotografer langsung melalui WhatsApp untuk membuka kembali kunci sesi.
          </div>
        </main>

        <footer className="text-center text-xs text-stone-400 py-4">
          Pickture &copy; 2026 &mdash; Layanan Pemilihan Foto Wisuda
        </footer>
      </div>
    );
  }

  // 3. Status 'closed' atau 'expired' -> Tampilkan halaman sesi ditutup
  if (!res.valid && (res.reason === 'CLOSED' || res.reason === 'EXPIRED')) {
    const isExpired = res.reason === 'EXPIRED';

    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-6">
        <header className="max-w-xl mx-auto w-full pt-4">
          <Image
            src="/picture.png"
            alt="Pickture"
            width={996}
            height={376}
            priority
            className="h-8 w-auto object-contain"
          />
        </header>

        <main className="max-w-md mx-auto w-full my-8 bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto shadow-inner">
            {isExpired ? <Clock className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Sesi Pemilihan Ditutup
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              {isExpired
                ? 'Batas waktu pemilihan foto untuk sesi ini telah berakhir.'
                : 'Sesi pemilihan foto ini telah resmi ditutup oleh fotografer.'}
            </p>
          </div>

          <p className="text-xs text-stone-400">
            Silakan hubungi fotografer Anda jika membutuhkan akses kembali.
          </p>
        </main>

        <footer className="text-center text-xs text-stone-400 py-4">
          Pickture &copy; 2026 &mdash; Layanan Pemilihan Foto Wisuda
        </footer>
      </div>
    );
  }

  // 4. Sesi Aktif ('open') -> Render Galeri Pemilihan Foto
  if (!res.session || !res.photos) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      <PhotoGrid
        slug={slug}
        clientName={res.session.client_name}
        university={res.session.university}
        maxSelection={res.session.max_selection}
        initialPhotos={res.photos}
        initialSelectedIds={res.selectedPhotoIds || []}
      />
    </div>
  );
}
