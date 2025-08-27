'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  const navigationItems: NavigationItem[] = [
    { href: '/admin', label: 'Dashboard', exact: true },
    { href: '/admin/proyectos', label: 'Proyectos', submenu: [
      { href: '/admin/proyectos', label: 'Gestionar Proyectos' },
      { href: '/admin/proyectos/categorias', label: 'Categorías de Proyectos' }
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
        <div className="mx-8 py-8 pt-16">
          <div className="max-w-[1600px] mx-auto overflow-x-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
              <p className="text-gray-600">Gestiona el contenido de tu sitio web</p>
            </div>

            <div className="flex gap-8 min-w-[1400px]">
              {/* Sidebar Navigation */}
              <div className="w-64 flex-shrink-0">
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

                {/* Quick Actions */}
                <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Acciones Rápidas</h3>
                  <div className="space-y-2">
                    <Link
                      href="/admin/proyectos/nuevo"
                      className="block px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      + Nuevo Proyecto
                    </Link>
                    <Link
                      href="/admin/noticias/nueva"
                      className="block px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    >
                      + Nueva Noticia
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
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] p-6">
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
