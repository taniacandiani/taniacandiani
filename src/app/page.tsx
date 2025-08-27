import type { Metadata } from 'next';
import Section from '@/components/Section';
import Hero from '@/components/Hero';
import NewsCard from '@/components/ui/NewsCard';
import MainLayout from '@/components/MainLayout';
import { HERO_SLIDES, NEWS_ITEMS } from '@/data/content';

export const metadata: Metadata = {
  title: 'Inicio',
  description: 'Explora el trabajo de Tania Candiani, artista contemporánea especializada en sitio específico, arqueología de los medios y prácticas sociales.',
  openGraph: {
    title: 'Tania Candiani - Artista Contemporánea',
    description: 'Explora el trabajo de Tania Candiani, artista contemporánea especializada en sitio específico.',
    type: 'website',
  },
};

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Tania Candiani",
    "jobTitle": "Artista Contemporánea",
    "description": "Artista contemporánea especializada en sitio específico, arqueología de los medios y prácticas sociales",
    "url": "https://taniacandiani.com",
    "sameAs": [
      "https://instagram.com/taniacandiani",
      // Add other social media URLs
    ],
    "knowsAbout": [
      "Arte Contemporáneo",
      "Sitio Específico",
      "Arqueología de los Medios",
      "Prácticas Sociales",
      "Instalaciones Artísticas"
    ],
    "worksFor": {
      "@type": "Organization",
      "name": "Artista Independiente"
    }
  };

  return (
    <MainLayout hasNavbarOffset={false}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div>
        <Hero slides={HERO_SLIDES} autoPlay={true} interval={6000} />

        <Section as="main">
          <div className="main-section py-40">
            <h3 className="font-bold mb-12">Noticias</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {NEWS_ITEMS.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          </div>
        </Section>
      </div>
    </MainLayout>
  );
}
