'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import Section from '@/components/Section';
import Hero from '@/components/Hero';
import NewsCard from '@/components/ui/NewsCard';
import ExhibitionCard from '@/components/ui/ExhibitionCard';
import MainLayout from '@/components/MainLayout';
import { HeroSkeleton, NewsCardSkeleton, ExhibitionCardSkeleton } from '@/components/ui/Skeleton';
import { HERO_SLIDES, PROJECTS, SAMPLE_NEWS } from '@/data/content';
import { ProjectStorage } from '@/lib/projectStorage';
import { NewsStorage } from '@/lib/newsStorage';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { Slide, NewsItem, Exhibition } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const { language } = useLanguage();
  const [heroSlides, setHeroSlides] = useState<Slide[]>(HERO_SLIDES);
  const [homeNews, setHomeNews] = useState<NewsItem[]>([]);
  const [activeExhibitions, setActiveExhibitions] = useState<Exhibition[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  // Estados de carga separados para renderizado progresivo
  const [heroLoading, setHeroLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [exhibitionsLoading, setExhibitionsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Cargar hero primero (prioridad alta)
        ProjectStorage.getFeatured()
          .then(featuredProjects => {
            if (featuredProjects.length > 0) {
              const projectSlides: Slide[] = featuredProjects.map(project => ({
                image: project.heroImages?.[0] || project.image,
                title: project.title,
                text: project.heroDescription || project.description
              }));
              setHeroSlides(projectSlides);
            }
            setHeroLoading(false);
          })
          .catch(error => {
            console.error('Error loading hero:', error);
            setHeroSlides(HERO_SLIDES);
            setHeroLoading(false);
          });

        // Cargar exhibitions (prioridad media)
        ExhibitionStorage.getActive()
          .then(exhibitions => {
            setActiveExhibitions(exhibitions);
            setExhibitionsLoading(false);
          })
          .catch(error => {
            console.error('Error loading exhibitions:', error);
            setActiveExhibitions([]);
            setExhibitionsLoading(false);
          });

        // Cargar news (prioridad media)
        NewsStorage.getForHome()
          .then(newsForHome => {
            setHomeNews(newsForHome);
            setNewsLoading(false);
          })
          .catch(error => {
            console.error('Error loading news:', error);
            setHomeNews(SAMPLE_NEWS.slice(0, 3));
            setNewsLoading(false);
          });

        // Verificar si storage está vacío (baja prioridad)
        Promise.all([
          ProjectStorage.getAll().catch(() => []),
          NewsStorage.getAll().catch(() => [])
        ]).then(([storedProjects, storedNews]) => {
          if (storedProjects.length === 0 && !isInitialized) {
            console.log('Using default projects from content.ts');
          }
          if (storedNews.length === 0 && !isInitialized) {
            console.log('Using default news from content.ts');
          }
          setIsInitialized(true);
        });

      } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to static content
        setHeroSlides(HERO_SLIDES);
        setHomeNews(SAMPLE_NEWS.slice(0, 3));
        setActiveExhibitions([]);
        setHeroLoading(false);
        setNewsLoading(false);
        setExhibitionsLoading(false);
      }
    };

    initializeData();
  }, [isInitialized]);

  // Listen for news updates from admin
  useEffect(() => {
    const handleNewsUpdate = async () => {
      try {
        const newsForHome = await NewsStorage.getForHome();
        setHomeNews(newsForHome);
      } catch (error) {
        console.error('Error updating news:', error);
      }
    };

    const handleExhibitionsUpdate = async () => {
      try {
        const exhibitions = await ExhibitionStorage.getActive();
        setActiveExhibitions(exhibitions);
      } catch (error) {
        console.error('Error updating exhibitions:', error);
      }
    };

    const handleProjectsUpdate = async () => {
      try {
        const featuredProjects = await ProjectStorage.getFeatured();
        if (featuredProjects.length > 0) {
          const projectSlides: Slide[] = featuredProjects.map(project => ({
            image: project.heroImages?.[0] || project.image,
            title: project.title,
            text: project.heroDescription || project.description
          }));
          setHeroSlides(projectSlides);
        } else {
          setHeroSlides(HERO_SLIDES);
        }
      } catch (error) {
        console.error('Error updating projects:', error);
        setHeroSlides(HERO_SLIDES);
      }
    };

    window.addEventListener('newsUpdated', handleNewsUpdate);
    window.addEventListener('projectsUpdated', handleProjectsUpdate);
    window.addEventListener('exhibitionsUpdated', handleExhibitionsUpdate);
    return () => {
      window.removeEventListener('newsUpdated', handleNewsUpdate);
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
      window.removeEventListener('exhibitionsUpdated', handleExhibitionsUpdate);
    };
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Tania Candiani",
    "jobTitle": "Artista Contemporánea",
    "description": "Artista contemporánea especializada en sitio específico, arqueología de los medios y prácticas sociales",
    "url": "https://taniacandiani.com",
    "sameAs": [
      "https://www.instagram.com/tcandiani/",
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

  // Renderizado progresivo - ya no hay pantalla de carga bloqueante
  return (
    <MainLayout hasNavbarOffset={false}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div>
        {/* Hero Section con skeleton mientras carga */}
        {heroLoading ? (
          <HeroSkeleton />
        ) : (
          <Hero slides={heroSlides} autoPlay={true} interval={6000} />
        )}

        <Section as="main" indented>
          <div className="main-section py-12 sm:py-20 lg:py-40">
            {/* Exhibitions Section con skeleton */}
            {exhibitionsLoading ? (
              <>
                <h3 className="font-medium text-black mb-12">{language === 'en' ? 'EXHIBITIONS' : 'EXPOSICIONES'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                  {[1, 2, 3].map((i) => (
                    <ExhibitionCardSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : activeExhibitions.length > 0 ? (
              <>
                <h3 className="font-medium text-black mb-12">{language === 'en' ? 'EXHIBITIONS' : 'EXPOSICIONES'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                  {activeExhibitions.map((exhibition) => (
                    <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
                  ))}
                </div>
              </>
            ) : null}

            {/* News Section con skeleton */}
            <h3 className="font-medium text-black mb-12">{language === 'en' ? 'NEWS' : 'NOTICIAS'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {newsLoading ? (
                // Mostrar skeletons mientras carga
                [1, 2, 3].map((i) => (
                  <NewsCardSkeleton key={i} />
                ))
              ) : homeNews.length > 0 ? (
                // Mostrar noticias cuando estén cargadas
                homeNews.map((news) => (
                  <NewsCard key={news.id} news={news} />
                ))
              ) : (
                // Mensaje cuando no hay noticias
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-500">
                    {language === 'en' ? 'No news available at this time.' : 'No hay noticias disponibles en este momento.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </MainLayout>
  );
}
