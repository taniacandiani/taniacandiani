'use client';

import Link from 'next/link';
import MainLayout from '@/components/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';

// Página 404 personalizada: se muestra cuando una URL no existe o cuando
// el contenido no está publicado (por ejemplo, un borrador visto sin
// sesión de administrador).
export default function NotFound() {
  const { language } = useLanguage();

  return (
    <MainLayout>
      <div className="container-mobile flex flex-col items-center justify-center min-h-[60vh] py-16 text-center">
        <p className="text-8xl font-medium mb-6">404</p>
        <h1 className="text-2xl md:text-3xl font-medium mb-4">
          {language === 'en' ? 'Page not found' : 'Página no encontrada'}
        </h1>
        <p className="text-gray-600 mb-10 max-w-md">
          {language === 'en'
            ? 'The page you are looking for does not exist or is no longer available.'
            : 'La página que buscas no existe o ya no está disponible.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
          >
            {language === 'en' ? 'Go to home' : 'Ir al inicio'}
          </Link>
          <Link
            href="/proyectos"
            className="border border-black px-6 py-3 rounded-md hover:bg-gray-100 transition-colors"
          >
            {language === 'en' ? 'View projects' : 'Ver proyectos'}
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
