import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NewsItem } from '@/types';
import { generateNewsExcerpt } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { optimizeCloudinaryUrl, CLOUDINARY_PRESETS } from '@/lib/cloudinaryUtils';

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const { language } = useLanguage();

  // Use English content if available and language is 'en'
  const title = language === 'en' && news.titleEn ? news.titleEn : news.title;
  const content = language === 'en' && news.contentEn ? news.contentEn : news.content;

  return (
    <article className="flex flex-col h-full" role="article" aria-labelledby={`news-title-${news.id}`}>
      <Link href={`/noticias/${news.slug}`} className="block border-b border-gray-200 pb-4 md:pb-12 h-[300px]">
        <Image
          src={optimizeCloudinaryUrl(news.image, CLOUDINARY_PRESETS.card)}
          alt={`Imagen del artículo: ${title}`}
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
            id={`news-title-${news.id}`}
            className="text-2xl font-semibold mt-4 md:mt-8 mb-4"
          >
            {title}
          </h2>
        </header>
        <p className="text-gray-700 mb-4" aria-describedby={`news-title-${news.id}`}>
          {generateNewsExcerpt(content, 150)}
        </p>
        <Link
          href={`/noticias/${news.slug}`}
          className="flex items-center text-2xl pt-5 pb-6 md:pb-0 text-black hover:underline rounded-sm p-1 -m-1 transition-colors mt-auto"
          aria-label={language === 'en' ? `Read more about ${news.title}` : `Leer más sobre ${news.title}`}
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

export default memo(NewsCard); 