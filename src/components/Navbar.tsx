'use client';

import Link from 'next/link';
import LanguageSelector from '@/components/ui/LanguageSelector';
import { NAVIGATION_ITEMS, SOCIAL_LINKS } from '@/constants/navigation';
import { AiFillInstagram } from "react-icons/ai";
import { MdEmail } from "react-icons/md";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-white z-50 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex justify-between items-center">
        {/* Logo a la izquierda */}
        <div className="flex-1">
          <Link href="/" className="text-4xl font-medium tracking-widest">
            TANIA CANDIANI
          </Link>
        </div>
        
        {/* Navigation items al centro */}
        <div className="flex items-center gap-8 flex-1 justify-center">
          {NAVIGATION_ITEMS.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="text-lg hover:text-gray-600 transition-colors duration-200"
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        {/* Social links + Language selector a la derecha */}
        <div className="flex items-center gap-5 flex-1 justify-end">
          <a 
            href={SOCIAL_LINKS.instagram} 
            className="text-2xl hover:text-gray-600 transition-colors duration-200"
          >
            <AiFillInstagram />
          </a>
          <a 
            href={SOCIAL_LINKS.email} 
            className="text-2xl hover:text-gray-600 transition-colors duration-200"
          >
            <MdEmail />
          </a>
          <span className="text-gray-400 text-2xl font-light">|</span>
          <LanguageSelector />
        </div>
      </div>
    </nav>
  );
} 