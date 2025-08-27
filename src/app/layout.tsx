import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Tania Candiani - Artista Contemporánea',
    template: '%s | Tania Candiani'
  },
  description: 'Portfolio oficial de Tania Candiani - Artista contemporánea especializada en sitio específico, arqueología de los medios y prácticas sociales.',
  keywords: [
    'arte contemporáneo',
    'Tania Candiani',
    'sitio específico',
    'instalaciones',
    'arqueología de los medios',
    'prácticas sociales',
    'arte conceptual',
    'arte mexicano',
    'artista contemporánea'
  ],
  authors: [{ name: 'Tania Candiani', url: 'https://taniacandiani.com' }],
  creator: 'Tania Candiani',
  publisher: 'Tania Candiani',
  metadataBase: new URL('https://taniacandiani.com'),
  alternates: {
    canonical: '/',
    languages: {
      'es-MX': '/es',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    url: 'https://taniacandiani.com',
    title: 'Tania Candiani - Artista Contemporánea',
    description: 'Portfolio oficial de Tania Candiani - Artista contemporánea especializada en sitio específico, arqueología de los medios y prácticas sociales.',
    siteName: 'Tania Candiani',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tania Candiani - Artista Contemporánea',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tania Candiani - Artista Contemporánea',
    description: 'Portfolio oficial de Tania Candiani - Artista contemporánea especializada en sitio específico.',
    images: ['/twitter-image.jpg'],
    creator: '@taniacandiani',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
    // yandex: 'yandex-verification-code',
    // yahoo: 'yahoo-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
