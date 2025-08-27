'use client';

import Link from 'next/link';
import { useState } from 'react';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { NAVIGATION_ITEMS, SOCIAL_LINKS } from '@/constants/navigation';
import { AiFillInstagram } from "react-icons/ai";
import { MdEmail } from "react-icons/md";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full bg-white z-50 shadow-sm" role="navigation" aria-label="Navegación principal">
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center">
        {/* Logo a la izquierda */}
        <div className="flex-1">
          <Link 
            href="/" 
            className="text-2xl md:text-4xl font-medium tracking-widest "

          >
            <span className="hidden sm:inline">TANIA CANDIANI</span>
            <span className="sm:hidden">T. CANDIANI</span>
          </Link>
        </div>
        
        {/* Navigation items al centro */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-center">
          {NAVIGATION_ITEMS.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="text-lg hover:text-gray-600 transition-colors duration-200  rounded-sm px-2 py-1"
              
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden flex-1 flex justify-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-xl p-2 hover:bg-gray-100 rounded-md transition-colors "
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
        
        {/* Social links + Language selector a la derecha */}
        <div className="flex items-center gap-3 sm:gap-5 flex-1 justify-end">
          <a 
            href={SOCIAL_LINKS.instagram} 
            className="text-xl sm:text-2xl hover:text-gray-600 transition-colors duration-200  rounded-sm p-1"
            aria-label="Visitar Instagram de Tania Candiani"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AiFillInstagram />
          </a>
          <a 
            href={SOCIAL_LINKS.email} 
            className="text-xl sm:text-2xl hover:text-gray-600 transition-colors duration-200  rounded-sm p-1"
            aria-label="Enviar email a Tania Candiani"
          >
            <MdEmail />
          </a>
          <span className="hidden sm:inline text-gray-400 text-2xl font-light" aria-hidden="true">|</span>
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200" role="menu" aria-label="Menú móvil">
          <div className="px-4 py-4 space-y-4">
            {NAVIGATION_ITEMS.map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className="block text-lg hover:text-gray-600 transition-colors duration-200  rounded-sm px-2 py-1"
                
                role="menuitem"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-gray-200">
              <LanguageSelector />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 