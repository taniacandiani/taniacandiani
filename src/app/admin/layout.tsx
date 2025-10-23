'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import MainLayout from '@/components/MainLayout';

interface NavigationItem {
  href: string;
  label: string;
  exact?: boolean;
  submenu?: { href: string; label: string; }[];
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuAccordionOpen, setMenuAccordionOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    { href: '/admin', label: 'Dashboard', exact: true },
    { href: '/admin/proyectos', label: 'Proyectos', submenu: [
      { href: '/admin/proyectos', label: 'Gestionar Proyectos' },
      { href: '/admin/proyectos/categorias', label: 'Categorías de Proyectos' }
    ]},
    { href: '/admin/exposiciones', label: 'Exposiciones', submenu: [
      { href: '/admin/exposiciones', label: 'Gestionar Exposiciones' },
      { href: '/admin/exposiciones/categorias', label: 'Categorías de Exposiciones' }
    ]},
    { href: '/admin/noticias', label: 'Noticias', submenu: [
      { href: '/admin/noticias', label: 'Gestionar Noticias' },
      { href: '/admin/noticias/categorias', label: 'Categorías de Noticias' }
    ]},
    { href: '/admin/acerca', label: 'Acerca', submenu: [
      { href: '/admin/acerca', label: 'Contenido de Acerca' },
      { href: '/admin/acerca/publicaciones', label: 'Publicaciones' }
    ]},
    { href: '/admin/contacto', label: 'Contacto' },
    { href: '/admin/media', label: 'Media' },
  ];

  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="container-mobile py-4 lg:py-8 pt-8 lg:pt-16">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6 lg:mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
              <p className="text-sm lg:text-base text-gray-600">Gestiona el contenido de tu sitio web</p>
            </div>

            {/* Mobile: Navegación en acordeón */}
            <div className="lg:hidden mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => setMenuAccordionOpen(!menuAccordionOpen)}
                  className="w-full flex justify-between items-center px-4 py-3"
                >
                  <span className="text-base font-medium text-gray-900">Menú de Navegación</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${menuAccordionOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {menuAccordionOpen && (
                  <nav className="px-4 pb-4 pt-2 border-t border-gray-200">
                    <ul className="space-y-2">
                      {navigationItems.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setMenuAccordionOpen(false)}
                            className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                              isActive(item.href, item.exact)
                                ? 'bg-black text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {item.label}
                          </Link>
                          {item.submenu && isActive(item.href) && (
                            <ul className="mt-1 ml-4 space-y-1">
                              {item.submenu.map((subItem) => (
                                <li key={subItem.href}>
                                  <Link
                                    href={subItem.href}
                                    onClick={() => setMenuAccordionOpen(false)}
                                    className={`block px-3 py-2 rounded-md text-xs transition-colors ${
                                      pathname === subItem.href
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    {subItem.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>
            </div>

            <div className="flex gap-8">
              {/* Desktop Sidebar Navigation */}
              <div className="hidden lg:block w-64 flex-shrink-0">
                <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <ul className="space-y-2">
                    {navigationItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                            isActive(item.href, item.exact)
                              ? 'bg-black text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </Link>
                        {item.submenu && isActive(item.href) && (
                          <ul className="mt-2 ml-4 space-y-1">
                            {item.submenu.map((subItem) => (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href}
                                  className={`block px-3 py-2 rounded-md text-xs transition-colors ${
                                    pathname === subItem.href
                                      ? 'bg-gray-800 text-white'
                                      : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {subItem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Quick Actions - Solo desktop */}
                <div className="hidden lg:block mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Acciones Rápidas</h3>
                  <div className="space-y-2">
                    <Link
                      href="/admin/proyectos/nuevo"
                      className="block px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      + Nuevo Proyecto
                    </Link>
                    <Link
                      href="/admin/exposiciones/nueva"
                      className="block px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    >
                      + Nueva Exposición
                    </Link>
                    <Link
                      href="/admin/noticias/nueva"
                      className="block px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    >
                      + Nueva Noticia
                    </Link>
                    <Link
                      href="/admin/media"
                      className="block px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                    >
                      📁 Gestionar Media
                    </Link>
                    <Link
                      href="/"
                      target="_blank"
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      👁️ Ver Sitio Web
                    </Link>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0 lg:min-w-[800px]">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px] lg:min-h-[600px] p-4 lg:p-6">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
