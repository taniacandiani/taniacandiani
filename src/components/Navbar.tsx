'use client';

import Section from '@/components/Section';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isMenuOpen]);

  // Handle click outside menu items
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="fixed w-full bg-white z-10 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 pt-2">
            <button className="hover:text-gray-600 font-bold">Español</button>
            <span className="text-gray-400">|</span>
            <button className="hover:text-gray-600">English</button>
          </div>
        </div>
        <a href="/" className="text-4xl font-medium tracking-widest text-center flex-1">TANIA CANDIANI</a>
        <div className="flex items-center gap-10 flex-1 justify-end">
         
          {/* Animated hamburger menu button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`hover:text-gray-600 z-20 ${isMenuOpen ? 'text-white' : 'text-black'}`}
            aria-label="Toggle menu"
          >
            <div className="relative w-7 h-7">
              <span className={`absolute top-1/2 left-0 w-7 h-[2px] bg-current transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? 'rotate-45' : '-translate-y-2'
              }`} />
              <span className={`absolute top-1/2 left-0 w-7 h-[2px] bg-current transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? 'opacity-0' : ''
              }`} />
              <span className={`absolute top-1/2 left-0 w-7 h-[2px] bg-current transform transition-all duration-300 ease-in-out ${
                isMenuOpen ? '-rotate-45' : 'translate-y-2'
              }`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsMenuOpen(false);
          }
        }}
        className={`fixed inset-0 bg-black/80 text-white transform transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-center">
          <a href="/" className="text-4xl font-medium tracking-widest text-white">TANIA CANDIANI</a>
        </div>
        <div className="h-[calc(100vh-100px)] flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center gap-8">
            <a href="#proyectos" className="text-4xl relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">Proyectos</a>
            <a href="#noticias" className="text-4xl relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">Noticias</a>
            <a href="#acerca" className="text-4xl relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">Acerca</a>
            <a href="#contacto" className="text-4xl relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">Contacto</a>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 ml-8">
            <a href="https://instagram.com/taniacandiani" className="text-2xl relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">Instagram</a>
            <span className="text-gray-400 text-2xl">|</span>
            <a href="mailto:contact@taniacandiani.com" className="text-2xl relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white after:transform after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300">Email</a>
          </div>
        </div>
      </div>
    </nav>
  );
} 