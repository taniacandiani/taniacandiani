'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import LanguageSelector from '@/components/ui/LanguageSelector';
import AdminNavMenu from '@/components/ui/AdminNavMenu';
import GlobalSearch from '@/components/GlobalSearch';
import { NAVIGATION_ITEMS, SOCIAL_LINKS } from '@/constants/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { AiFillInstagram } from "react-icons/ai";
import { MdEmail } from "react-icons/md";
import { IoSearch } from "react-icons/io5";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { language } = useLanguage();

  return (
    <nav className="fixed top-0 w-full bg-white z-[9999] shadow-sm" role="navigation" aria-label="Navegación principal">
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center">
        {/* Logo a la izquierda */}
        <div className="flex-1">
          <Link
            href="/"
            className="text-lg sm:text-xl md:text-2xl xl:text-4xl font-medium tracking-widest whitespace-nowrap"
          >
            TANIA CANDIANI
          </Link>
        </div>

        {/* Navigation items al centro - solo desktop grande (xl+) */}
        <div className="hidden xl:flex items-center gap-8 flex-1 justify-center">
          {NAVIGATION_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-lg hover:text-gray-600 transition-colors duration-200 rounded-sm px-2 py-1 group"
              >
                {language === 'en' && item.label_en ? item.label_en : item.label}
                {/* Animated underline */}
                <div className={`absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 ease-in-out group-hover:w-full ${isActive ? 'w-full' : ''}`}></div>
              </Link>
            );
          })}
          {/* Acceso al panel: solo se renderiza con sesión de admin */}
          <AdminNavMenu />
        </div>

        {/* Search + Social links + Language selector + Hamburger - a la derecha */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-end">
          <button
            onClick={() => setSearchOpen(true)}
            className="text-xl sm:text-2xl hover:text-gray-600 transition-colors duration-200 rounded-sm p-1 cursor-pointer"
            aria-label={language === 'en' ? 'Search' : 'Buscar'}
          >
            <IoSearch />
          </button>
          <a
            href={SOCIAL_LINKS.instagram}
            className="text-xl sm:text-2xl hover:text-gray-600 transition-colors duration-200 rounded-sm p-1"
            aria-label="Visitar Instagram de Tania Candiani"
            target="_blank"
            rel="noopener noreferrer"
          >
            <AiFillInstagram />
          </a>
          <Link
            href="/contacto"
            className="text-xl sm:text-2xl hover:text-gray-600 transition-colors duration-200 rounded-sm p-1"
            aria-label={language === 'en' ? 'Go to contact page' : 'Ir a página de contacto'}
          >
            <MdEmail />
          </Link>
          <span className="hidden sm:inline text-gray-400 text-2xl font-light" aria-hidden="true">|</span>
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          {/* Hamburger menu - visible en mobile, tablet e iPad Pro, oculto en desktop (xl+) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden text-xl p-2 hover:bg-gray-100 rounded-md transition-colors"
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
      </div>
      
      {/* Mobile/Tablet/iPad Pro menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-t border-gray-200" role="menu" aria-label="Menú móvil">
          <div className="px-4 py-4 space-y-4">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative block text-lg hover:text-gray-600 transition-colors duration-200 rounded-sm px-2 py-1 group"
                  role="menuitem"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {language === 'en' && item.label_en ? item.label_en : item.label}
                  {/* Animated underline */}
                  <div className={`absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-300 ease-in-out group-hover:w-full ${isActive ? 'w-full' : ''}`}></div>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-gray-200">
              <LanguageSelector />
            </div>
            {/* Acceso al panel: solo se renderiza con sesión de admin */}
            <AdminNavMenu mobile onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
} 