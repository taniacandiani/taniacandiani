'use client';

import { useState, useEffect } from 'react';

export default function GoToTopButton() {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const calculateOpacity = () => {
      const scrollY = window.pageYOffset;
      const startFade = 400; // Empieza a aparecer
      const fullVisible = 600; // Completamente visible
      
      if (scrollY < startFade) {
        setOpacity(0);
      } else if (scrollY > fullVisible) {
        setOpacity(1);
      } else {
        // Fade gradual entre 400px y 600px
        const fadeRange = fullVisible - startFade;
        const currentProgress = scrollY - startFade;
        setOpacity(currentProgress / fadeRange);
      }
    };

    window.addEventListener('scroll', calculateOpacity);
    return () => window.removeEventListener('scroll', calculateOpacity);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (opacity === 0) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 bg-black text-white p-2 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
      style={{ opacity, transform: `translateY(${opacity === 0 ? '20px' : '0px'})` }}
      aria-label="Ir al inicio de la página"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}
