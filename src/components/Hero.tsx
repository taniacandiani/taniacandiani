"use client";

import React, { memo, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Section from '@/components/Section';
import { useSlider } from '@/hooks/useSlider';
import { HeroProps, Project } from '@/types';
import { PROJECT_INFO } from '@/data/content';
import { ProjectStorage } from '@/lib/projectStorage';
import { useLanguage } from '@/contexts/LanguageContext';
import { optimizeCloudinaryUrl, CLOUDINARY_PRESETS } from '@/lib/cloudinaryUtils';

const Hero: React.FC<HeroProps> = ({ slides = [], autoPlay = true, interval = 5000 }) => {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const { language } = useLanguage();

  const { currentSlide, fade, nextSlide, prevSlide } = useSlider({
    itemCount: slides.length,
    autoPlay,
    interval
  });

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }
  };

  // Load featured projects
  useEffect(() => {
    const loadFeaturedProjects = async () => {
      try {
        setLoading(true);
        const projects = await ProjectStorage.getFeatured();
        setFeaturedProjects(projects);
      } catch (error) {
        console.error('Error loading featured projects:', error);
        setFeaturedProjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedProjects();
  }, [updateTrigger]);

  const handlePrevSlide = useCallback(() => {
    prevSlide();
  }, [prevSlide]);

  const handleNextSlide = useCallback(() => {
    nextSlide();
  }, [nextSlide]);

  // Find if current slide corresponds to a project
  const getCurrentProjectLink = useCallback(() => {
    if (slides.length === 0 || loading) return '#';
    
    const currentSlideData = slides[currentSlide];
    const matchingProject = featuredProjects.find(project => 
      project.title === currentSlideData.title
    );
    
    return matchingProject ? `/proyectos/${matchingProject.slug}` : '#';
  }, [slides, currentSlide, featuredProjects, loading]);

  // Get current project info for metadata display
  const getCurrentProjectInfo = useCallback(() => {
    if (slides.length === 0 || loading) return null;
    
    const currentSlideData = slides[currentSlide];
    const matchingProject = featuredProjects.find(project => 
      project.title === currentSlideData.title
    );
    
    return matchingProject;
  }, [slides, currentSlide, featuredProjects, loading]);

  // Listen for project updates to refresh metadata
  useEffect(() => {
    const handleProjectsUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('projectsUpdated', handleProjectsUpdate);
    return () => {
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
    };
  }, []);

  if (slides.length === 0) {
    return (
      <Section fullWidth>
        <div className="relative overflow-hidden mt-16 h-[60vh] sm:h-[70vh] lg:h-[85vh] bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">
            {language === 'en' ? 'No content available' : 'No hay contenido disponible'}
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section fullWidth>
      <div
        className="hero-section relative overflow-hidden mt-16 w-full max-w-full z-0"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="slider transition-opacity duration-500 ease-in-out">
          <a href={getCurrentProjectLink()} className="block">
            <Image
              src={optimizeCloudinaryUrl(slides[currentSlide].image, CLOUDINARY_PRESETS.hero)}
              alt={`Slide ${currentSlide}`}
              width={1920}
              height={1080}
              priority
              fetchPriority="high"
              sizes="100vw"
              quality={75}
              className={`w-full h-[60vh] sm:h-[70vh] lg:h-[85vh] object-cover transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'} cursor-pointer`}
            />
          </a>
          <div className="absolute inset-0 bg-black opacity-50 pointer-events-none"></div>
        </div>

        {/* Chevrones sobre la imagen - solo mobile - centrados verticalmente */}
        <div className="lg:hidden absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
          <button
            onClick={handlePrevSlide}
            aria-label="Diapositiva anterior"
            className="p-2 hover:bg-white/20 rounded-full transition-colors pointer-events-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={handleNextSlide}
            aria-label="Siguiente diapositiva"
            className="p-2 hover:bg-white/20 rounded-full transition-colors pointer-events-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="absolute bottom-32 sm:bottom-36 md:bottom-40 lg:bottom-44 left-12 sm:left-8 lg:left-20 right-12 sm:right-8 p-3 sm:p-4 text-left text-white max-w-[calc(100%-6rem)] sm:max-w-md md:max-w-lg lg:max-w-2xl">
          <h2 className="font-bold mb-2 sm:mb-3 lg:mb-4 leading-tight text-xl sm:text-2xl md:text-3xl lg:text-4xl">
            {language === 'en' && getCurrentProjectInfo()?.title_en
              ? getCurrentProjectInfo()?.title_en
              : slides[currentSlide].title}
          </h2>
          <p className="mt-1 text-sm sm:text-base leading-snug sm:leading-relaxed text-left sm:text-justify line-clamp-3 sm:line-clamp-4 lg:line-clamp-none">
            {language === 'en' && getCurrentProjectInfo()?.heroDescription_en
              ? getCurrentProjectInfo()?.heroDescription_en
              : slides[currentSlide].text}
          </p>
        </div>
        
        {/* Barra inferior - Desktop: metadata + botones | Mobile: solo botón Ver Proyecto */}
        <div className="absolute bottom-0 left-0 right-0 bg-white">
          {/* Desktop: Metadata y navegación */}
          <div className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-gray-300">
            <div className="flex items-center gap-8 xl:gap-12">
              <button
                onClick={handlePrevSlide}
                aria-label="Diapositiva anterior"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm whitespace-nowrap">
                  {language === 'en' ? 'Commissioned by' : 'Comisionado por'}
                </span>
                <span className="text-sm truncate">
                  {loading
                    ? ''
                    : (language === 'en' && getCurrentProjectInfo()?.commissionedBy_en
                      ? getCurrentProjectInfo()?.commissionedBy_en
                      : getCurrentProjectInfo()?.commissionedBy || (language === 'en' ? 'Not available' : 'No disponible'))}
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm whitespace-nowrap">
                  {language === 'en' ? 'Location' : 'Ubicación'}
                </span>
                <span className="text-sm truncate">
                  {loading
                    ? ''
                    : (language === 'en' && getCurrentProjectInfo()?.location_en
                      ? getCurrentProjectInfo()?.location_en
                      : getCurrentProjectInfo()?.location || (language === 'en' ? 'Not available' : 'No disponible'))}
                </span>
              </div>

              <div className="flex flex-col min-w-0 shrink-0">
                <span className="font-black text-sm whitespace-nowrap">
                  {language === 'en' ? 'Year' : 'Año'}
                </span>
                <span className="text-sm">
                  {loading ? '' : (getCurrentProjectInfo()?.year || (language === 'en' ? 'Not available' : 'No disponible'))}
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <span className="font-black text-sm whitespace-nowrap">
                  {language === 'en' ? 'Category' : 'Categoría'}
                </span>
                <span className="text-sm truncate">
                  {loading
                    ? ''
                    : (getCurrentProjectInfo()?.categories?.[0] || (language === 'en' ? 'Not available' : 'No disponible'))}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-8 xl:gap-12">
              <a
                href={getCurrentProjectLink()}
                className="bg-black text-white px-8 xl:px-10 py-2.5 rounded-[5px] hover:bg-gray-800 transition-colors text-sm xl:text-base font-medium whitespace-nowrap"
              >
                {language === 'en' ? 'View Project' : 'Ver Proyecto'}
              </a>

              <button
                onClick={handleNextSlide}
                aria-label="Siguiente diapositiva"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile: Solo botón Ver Proyecto */}
          <div className="lg:hidden px-4 py-4 border-b border-gray-300">
            <a
              href={getCurrentProjectLink()}
              className="block w-full text-center bg-black text-white px-6 py-3 rounded-[5px] hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              {language === 'en' ? 'View Project' : 'Ver Proyecto'}
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default memo(Hero);

// Custom CSS for hero section
const heroStyles = `
  .hero-section h2 {
    line-height: 1 !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'hero-custom-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = heroStyles;
    document.head.appendChild(style);
  }
} 