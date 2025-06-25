import Image from 'next/image';
import { NewsItem } from '@/types';

interface NewsCardProps {
  news: NewsItem;
}

const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-200 pb-12 h-[300px]">
        <Image
          src={news.image}
          alt={news.title}
          width={400}
          height={300}
          className="w-full h-full object-cover rounded-[5px]"
        />
      </div>
      <h4 className="text-2xl font-semibold mt-8 mb-4">{news.title}</h4>
      <p className="text-gray-700 mb-4">{news.description}</p>
      <a href={news.link} className="flex items-center text-2xl pt-5 text-black hover:underline">
        Leer Más 
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  );
};

export default NewsCard; 