import React, { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NewsItem } from '@/types';

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  return (
    <article className="flex flex-col" role="article" aria-labelledby={`news-title-${news.id}`}>
      <div className="border-b border-gray-200 pb-12 h-[300px]">
        <Image
          src={news.image}
          alt={`Imagen del artículo: ${news.title}`}
          width={400}
          height={300}
          className="w-full h-full object-cover rounded-[5px]"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <header>
        <h2 
          id={`news-title-${news.id}`}
          className="text-2xl font-semibold mt-8 mb-4"
        >
          {news.title}
        </h2>
      </header>
      <p className="text-gray-700 mb-4" aria-describedby={`news-title-${news.id}`}>
        {news.description}
      </p>
      <Link 
        href={news.link} 
        className="flex items-center text-2xl pt-5 text-black hover:underline  rounded-sm p-1 -m-1 transition-colors"
        aria-label={`Leer más sobre ${news.title}`}
      >
        Leer Más 
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
    </article>
  );
};

export default memo(NewsCard); 