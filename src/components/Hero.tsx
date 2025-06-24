"use client";

import React, { useState, useEffect } from 'react';
import Section from '@/components/Section';

interface Slide {
  image: string;
  title: string;
  text: string;
}

interface HeroProps {
  slides?: Slide[];
}

const Hero: React.FC<HeroProps> = ({ slides = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setFade(true);
      }, 300);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (slides.length === 0) {
    return <div>No slides available</div>;
  }

  return (
    <Section fullWidth>
      <div className="relative overflow-hidden">
        <div className="slider transition-opacity duration-500 ease-in-out">
          <img
            src={slides[currentSlide].image}
            alt={`Slide ${currentSlide}`}
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
            <button onClick={prevSlide}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex flex-col pl-10">
              <span className="font-black">Comissionado por</span>
              <span>Fragmentos, Espacio de Arte y Memoria, Bogotá</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black">Curadora</span>
              <span>Gabriela Rangel</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black">Año</span>
              <span>2024</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black">Categoría</span>
              <span>Sitio Específico</span>
            </div>
          </div>
          <div className="flex items-center space-x-20">
            <a href="#" className="bg-black text-white px-10 py-2 rounded-[5px] hover:bg-gray-800">
              Ver Proyecto
            </a>
            <button onClick={nextSlide}>
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