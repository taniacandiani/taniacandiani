'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminNavMenuProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

// Acceso rápido al panel para el admin con sesión iniciada. En el sitio
// público no se muestra nada a los visitantes: el componente consulta
// /api/auth/session y solo renderiza si hay sesión de admin.
export default function AdminNavMenu({ mobile = false, onNavigate }: AdminNavMenuProps) {
  const { language } = useLanguage();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { isAdmin: false }))
      .then(data => {
        if (!cancelled) setIsAdmin(!!data.isAdmin);
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cerrar el dropdown al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error logging out:', error);
    }
    // Recargar para limpiar cachés en memoria (por ejemplo, borradores)
    window.location.reload();
  };

  if (!isAdmin) return null;

  const panelLabel = language === 'en' ? 'Admin panel' : 'Panel de administración';
  const logoutLabel = language === 'en' ? 'Log out' : 'Cerrar sesión';

  // Versión para el menú móvil: enlaces en bloque bajo un divisor
  if (mobile) {
    return (
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <Link
          href="/admin"
          className="block text-lg hover:text-gray-600 transition-colors duration-200 rounded-sm px-2 py-1"
          role="menuitem"
          onClick={onNavigate}
        >
          Admin
        </Link>
        <button
          onClick={handleLogout}
          className="block w-full text-left text-lg text-gray-600 hover:text-black transition-colors duration-200 rounded-sm px-2 py-1"
          role="menuitem"
        >
          {logoutLabel}
        </button>
      </div>
    );
  }

  // Versión desktop: separador + botón "Admin" con dropdown
  return (
    <>
      <span className="text-gray-400 text-2xl font-light" aria-hidden="true">|</span>
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-lg hover:text-gray-600 transition-colors duration-200 rounded-sm px-2 py-1"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          Admin
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1"
            role="menu"
          >
            <Link
              href="/admin"
              className="block px-4 py-2 text-base hover:bg-gray-100 transition-colors"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {panelLabel}
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-base text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
              role="menuitem"
            >
              {logoutLabel}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
