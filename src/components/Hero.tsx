"use client";

import React, { memo, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Section from '@/components/Section';
import { useSlider } from '@/hooks/useSlider';
import { HeroProps } from '@/types';
import { PROJECT_INFO } from '@/data/content';
import { ProjectStorage } from '@/lib/projectStorage';

const Hero: React.FC<HeroProps> = ({ slides = [], autoPlay = true, interval = 5000 }) => {
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  const { currentSlide, fade, nextSlide, prevSlide } = useSlider({ 
    itemCount: slides.length,
    autoPlay,
    interval
  });

  const handlePrevSlide = useCallback(() => {
    prevSlide();
  }, [prevSlide]);

  const handleNextSlide = useCallback(() => {
    nextSlide();
  }, [nextSlide]);

  // Find if current slide corresponds to a project
  const getCurrentProjectLink = useCallback(() => {
    if (slides.length === 0) return '#';
    
    const currentSlideData = slides[currentSlide];
    const featuredProjects = ProjectStorage.getFeatured();
    
    const matchingProject = featuredProjects.find(project => 
      project.title === currentSlideData.title
    );
    
    return matchingProject ? `/proyectos/${matchingProject.slug}` : '#';
  }, [slides, currentSlide]);

  // Get current project info for metadata display
  const getCurrentProjectInfo = useCallback(() => {
    if (slides.length === 0) return null;
    
    const currentSlideData = slides[currentSlide];
    const featuredProjects = ProjectStorage.getFeatured();
    
    const matchingProject = featuredProjects.find(project => 
      project.title === currentSlideData.title
    );
    
    return matchingProject;
  }, [slides, currentSlide, updateTrigger]);

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
        <div className="relative overflow-hidden mt-16 h-[85vh] bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">No hay contenido disponible</p>
        </div>
      </Section>
    );
  }

  return (
    <Section fullWidth>
      <div className="hero-section relative overflow-hidden mt-16">
        <div className="slider transition-opacity duration-500 ease-in-out">
          <Image
            src={slides[currentSlide].image}
            alt={`Slide ${currentSlide}`}
            width={1920}
            height={1080}
            priority
            className={`w-full h-[85vh] object-cover transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        
        <div className="absolute bottom-32 sm:bottom-44 left-4 sm:left-8 lg:left-20 p-4 text-left text-white max-w-xs sm:max-w-2xl">
          <h2 className="font-bold mb-4 leading-none">{slides[currentSlide].title}</h2>
          <p className="mt-1 text-justify">{slides[currentSlide].text}</p>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-white min-h-[100px] flex flex-col lg:flex-row items-center justify-between px-2 sm:px-4 py-4 border-b border-gray-300">
          <div className="flex items-center space-x-4 lg:space-x-12 w-full lg:w-auto justify-between lg:justify-start mb-4 lg:mb-0">
            <button 
              onClick={handlePrevSlide} 
              aria-label="Diapositiva anterior"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors order-1 lg:order-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="hidden sm:flex flex-col lg:pl-6 order-2 lg:order-none">
              <span className="font-black text-xs lg:text-sm">Comisionado por</span>
              <span className="text-xs lg:text-sm truncate max-w-[120px] lg:max-w-none">
                {getCurrentProjectInfo()?.commissionedBy || 'No disponible'}
              </span>
            </div>
            
            <div className="hidden md:flex flex-col order-3 lg:order-none">
              <span className="font-black text-xs lg:text-sm">Ubicación</span>
              <span className="text-xs lg:text-sm truncate max-w-[120px] lg:max-w-none">
                {getCurrentProjectInfo()?.location || 'No disponible'}
              </span>
            </div>
            
            <div className="flex flex-col order-4 lg:order-none">
              <span className="font-black text-xs lg:text-sm">Año</span>
              <span className="text-xs lg:text-sm">
                {getCurrentProjectInfo()?.year || 'No disponible'}
              </span>
            </div>
            
            <div className="flex flex-col order-5 lg:order-none">
              <span className="font-black text-xs lg:text-sm">Categoría</span>
              <span className="text-xs lg:text-sm truncate max-w-[80px] lg:max-w-none">
                {getCurrentProjectInfo()?.category || 'No disponible'}
              </span>
            </div>

            <button 
              onClick={handleNextSlide} 
              aria-label="Siguiente diapositiva"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors order-6 lg:order-none lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="hidden lg:flex items-center space-x-12">
            <a 
              href={getCurrentProjectLink()} 
              className="bg-black text-white px-6 lg:px-10 py-2 rounded-[5px] hover:bg-gray-800 transition-colors text-sm lg:text-base "
            >
              Ver Proyecto
            </a>
            
            <button 
              onClick={handleNextSlide} 
              aria-label="Siguiente diapositiva"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Mobile CTA */}
          <div className="lg:hidden w-full">
            <a 
              href={getCurrentProjectLink()} 
              className="block w-full text-center bg-black text-white px-6 py-3 rounded-[5px] hover:bg-gray-800 transition-colors text-sm "
            >
              Ver Proyecto
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