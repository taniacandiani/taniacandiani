import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Exhibition } from '@/types';
import { generateNewsExcerpt } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExhibitionCardProps {
  exhibition: Exhibition;
}

const ExhibitionCard: React.FC<ExhibitionCardProps> = ({ exhibition }) => {
  const { language } = useLanguage();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Use English content if available and language is 'en'
  const title = language === 'en' && exhibition.titleEn ? exhibition.titleEn : exhibition.title;
  const content = language === 'en' && exhibition.contentEn ? exhibition.contentEn : exhibition.content;
  const venue = language === 'en' && exhibition.venueEn ? exhibition.venueEn : exhibition.venue;

  return (
    <article className="flex flex-col h-full" role="article" aria-labelledby={`exhibition-title-${exhibition.id}`}>
      <Link href={`/exposiciones/${exhibition.slug}`} className="block border-b border-gray-200 pb-4 md:pb-12 h-[300px]">
        <Image
          src={exhibition.image || '/placeholder-image.jpg'}
          alt={`Imagen de la exposición: ${title}`}
          width={600}
          height={400}
          className="w-full h-full object-cover rounded-[5px] cursor-pointer hover:opacity-90 transition-opacity"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Link>
      <div className="flex flex-col flex-1">
        <header>
          <h2
            id={`exhibition-title-${exhibition.id}`}
            className="text-2xl font-semibold mt-4 md:mt-8 mb-4"
          >
            {title}
          </h2>
        </header>

        {/* Date and venue info */}
        {(exhibition.startDate || venue) && (
          <div className="text-gray-500 text-sm mb-4">
            {exhibition.startDate && (
              <span>
                {formatDate(exhibition.startDate)}
                {exhibition.endDate && ` - ${formatDate(exhibition.endDate)}`}
              </span>
            )}
            {exhibition.startDate && venue && <span className="mx-2">•</span>}
            {venue && <span>{venue}</span>}
          </div>
        )}

        <p className="text-gray-700 mb-4" aria-describedby={`exhibition-title-${exhibition.id}`}>
          {generateNewsExcerpt(content, 150)}
        </p>

        <Link
          href={`/exposiciones/${exhibition.slug}`}
          className="flex items-center text-2xl pt-5 pb-6 md:pb-0 text-black hover:underline rounded-sm p-1 -m-1 transition-colors mt-auto"
          aria-label={language === 'en' ? `Read more about ${title}` : `Leer más sobre ${title}`}
        >
          {language === 'en' ? 'Read More' : 'Leer Más'}
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
};

export default memo(ExhibitionCard);