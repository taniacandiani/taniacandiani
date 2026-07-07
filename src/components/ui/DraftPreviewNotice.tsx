'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface DraftPreviewNoticeProps {
  status?: 'published' | 'draft' | 'archived';
}

// Aviso flotante que se muestra al admin cuando previsualiza contenido
// no publicado. El público nunca recibe borradores desde la API, por lo
// que este componente solo llega a renderizarse en sesiones de admin.
export default function DraftPreviewNotice({ status }: DraftPreviewNoticeProps) {
  const { language } = useLanguage();

  if (!status || status === 'published') return null;

  const statusLabel = status === 'draft'
    ? (language === 'en' ? 'Draft' : 'Borrador')
    : (language === 'en' ? 'Archived' : 'Archivado');

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 bg-amber-400 text-black text-sm font-medium px-4 py-2 rounded-md shadow-lg pointer-events-none">
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span>
        {statusLabel} — {language === 'en'
          ? 'preview visible only to administrators'
          : 'vista previa visible solo para administradores'}
      </span>
    </div>
  );
}
