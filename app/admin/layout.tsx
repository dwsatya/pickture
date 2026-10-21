import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pickture by NayakaVisuals',
  description: 'Kelola sesi pemilihan foto wisuda dan sinkronisasi Google Drive.',
  icons: {
    icon: '/logo1.png',
    apple: '/logo1.png',
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
