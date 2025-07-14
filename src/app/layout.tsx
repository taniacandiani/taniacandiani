import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Tania Candiani - Artista Contemporánea',
  description: 'Portfolio oficial de Tania Candiani - Artista contemporánea especializada en sitio específico',
  keywords: 'arte contemporáneo, Tania Candiani, sitio específico, instalaciones',
  authors: [{ name: 'Tania Candiani' }],
  openGraph: {
    title: 'Tania Candiani',
    description: 'Portfolio website for Tania Candiani',
    type: 'website',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
