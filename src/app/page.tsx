'use client';

import { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import Section from '@/components/Section';
import Hero from '@/components/Hero';
import NewsCard from '@/components/ui/NewsCard';
import MainLayout from '@/components/MainLayout';
import { HERO_SLIDES, PROJECTS, SAMPLE_NEWS } from '@/data/content';
import { ProjectStorage } from '@/lib/projectStorage';
import { NewsStorage } from '@/lib/newsStorage';
import { Slide, NewsItem } from '@/types';

export default function Home() {
  const [heroSlides, setHeroSlides] = useState<Slide[]>(HERO_SLIDES);
  const [homeNews, setHomeNews] = useState<NewsItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Initialize with existing projects if storage is empty
        const storedProjects = await ProjectStorage.getAll();
        if (storedProjects.length === 0 && !isInitialized) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default projects from content.ts');
        }
        
        // Initialize with existing news if storage is empty
        const storedNews = await NewsStorage.getAll();
        if (storedNews.length === 0 && !isInitialized) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default news from content.ts');
        }

        // Get featured projects for hero
        const featuredProjects = await ProjectStorage.getFeatured();
        
        if (featuredProjects.length > 0) {
          const projectSlides: Slide[] = featuredProjects.map(project => ({
            image: project.heroImages?.[0] || project.image,
            title: project.title,
            text: project.heroDescription || project.description
          }));
          
          // Only show featured projects, no static slides
          setHeroSlides(projectSlides);
        } else {
          // Fallback to static slides if no projects are featured
          setHeroSlides(HERO_SLIDES);
        }

        // Get news for home
        const newsForHome = await NewsStorage.getForHome();
        setHomeNews(newsForHome);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to static content
        setHeroSlides(HERO_SLIDES);
        setHomeNews(SAMPLE_NEWS.slice(0, 3));
      } finally {
        setLoading(false);
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
    return () => {
      window.removeEventListener('newsUpdated', handleNewsUpdate);
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
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

  if (loading) {
    return (
      <MainLayout hasNavbarOffset={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout hasNavbarOffset={false}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div>
        <Hero slides={heroSlides} autoPlay={true} interval={6000} />

        <Section as="main">
          <div className="main-section py-40">
            <h3 className="font-medium text-black mb-12">NOTICIAS</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {homeNews.length > 0 ? (
                homeNews.map((news) => (
                  <NewsCard key={news.id} news={news} />
                ))
              ) : (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-500">No hay noticias disponibles en este momento.</p>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </MainLayout>
  );
}
