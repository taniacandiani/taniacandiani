"use client";

import React from 'react';
import Image from 'next/image';
import Section from '@/components/Section';
import { useSlider } from '@/hooks/useSlider';
import { Slide } from '@/types';
import { PROJECT_INFO } from '@/data/content';

interface HeroProps {
  slides?: Slide[];
}

const Hero: React.FC<HeroProps> = ({ slides = [] }) => {
  const { currentSlide, fade, nextSlide, prevSlide } = useSlider({ 
    itemCount: slides.length 
  });

  if (slides.length === 0) {
    return <div>No slides available</div>;
  }

  return (
    <Section fullWidth>
      <div className="relative overflow-hidden">
        <div className="slider transition-opacity duration-500 ease-in-out">
          <Image
            src={slides[currentSlide].image}
            alt={`Slide ${currentSlide}`}
            width={1920}
            height={1080}
            priority
            className={`w-full h-screen object-cover transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        
        <div className="absolute bottom-40 left-20 p-4 text-left text-white max-w-2xl">
          <h2 className="text-5xl font-bold mb-4">{slides[currentSlide].title}</h2>
          <p className="mt-1 text-justify">{slides[currentSlide].text}</p>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 bg-white h-25 flex items-center justify-between px-4 border-b border-gray-300">
          <div className="flex items-center space-x-20">
            <button onClick={prevSlide} aria-label="Previous slide">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex flex-col pl-10">
              <span className="font-black">Comissionado por</span>
              <span>{PROJECT_INFO.commissionedBy}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="font-black">Curadora</span>
              <span>{PROJECT_INFO.curator}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="font-black">Año</span>
              <span>{PROJECT_INFO.year}</span>
            </div>
            
            <div className="flex flex-col">
              <span className="font-black">Categoría</span>
              <span>{PROJECT_INFO.category}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-20">
            <a href="#" className="bg-black text-white px-10 py-2 rounded-[5px] hover:bg-gray-800">
              Ver Proyecto
            </a>
            
            <button onClick={nextSlide} aria-label="Next slide">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Hero; 