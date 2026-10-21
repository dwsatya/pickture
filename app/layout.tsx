import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Pickture — Pemilihan Foto Wisuda',
  description: 'Aplikasi pemilihan foto wisuda praktis, cepat, dan mobile-friendly untuk klien fotografer.',
  icons: {
    icon: [
      { url: '/logo1.png', href: '/logo1.png' },
    ],
    apple: [
      { url: '/logo1.png', href: '/logo1.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-zinc-50 text-zinc-900 selection:bg-amber-100 selection:text-amber-900">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
