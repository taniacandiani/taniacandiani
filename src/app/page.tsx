import Section from '@/components/Section';
import Hero from '@/components/Hero';
import NewsCard from '@/components/ui/NewsCard';
import { HERO_SLIDES, NEWS_ITEMS } from '@/data/content';

export default function Home() {
  return (
    <div>
      <Hero slides={HERO_SLIDES} />

      <Section>
        <div className="py-40">
          <h3 className="text-5xl font-bold mb-12">Noticias</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {NEWS_ITEMS.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
