'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProjectStorage } from '@/lib/projectStorage';
import { NewsStorage } from '@/lib/newsStorage';
import { PublicationStorage } from '@/lib/publicationStorage';
import { PROJECTS, SAMPLE_NEWS, SAMPLE_PUBLICATIONS } from '@/data/content';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    publishedProjects: 0,
    featuredProjects: 0,
    totalNews: 0,
    publishedNews: 0,
    homeNews: 0,
    totalPublications: 0,
    publishedPublications: 0
  });

  useEffect(() => {
    // Initialize with existing projects if localStorage is empty
    const storedProjects = ProjectStorage.getAll();
    if (storedProjects.length === 0) {
      ProjectStorage.saveAll(PROJECTS);
    }

    // Initialize with existing news if localStorage is empty
    const storedNews = NewsStorage.getAll();
    if (storedNews.length === 0) {
      NewsStorage.saveAll(SAMPLE_NEWS);
    }

    // Initialize with existing publications if localStorage is empty
    const storedPublications = PublicationStorage.getAll();
    if (storedPublications.length === 0) {
      PublicationStorage.saveAll(SAMPLE_PUBLICATIONS);
    }

    const projects = ProjectStorage.getAll();
    const news = NewsStorage.getAll();
    const publications = PublicationStorage.getAll();
    const publishedNews = news.filter(n => n.status === 'published');
    const homeNews = news.filter(n => n.showInHome && n.status === 'published');
    const publishedPublications = publications.filter(p => p.status === 'published');

    setStats({
      totalProjects: projects.length,
      publishedProjects: projects.filter(p => p.status === 'published').length,
      featuredProjects: projects.filter(p => p.showInHomeHero).length,
      totalNews: news.length,
      publishedNews: publishedNews.length,
      homeNews: homeNews.length,
      totalPublications: publications.length,
      publishedPublications: publishedPublications.length
    });
  }, []);

  const quickActions = [
    {
      title: 'Nuevo Proyecto',
      description: 'Crear un nuevo proyecto artístico',
      href: '/admin/proyectos/nuevo',
      color: 'bg-blue-500 hover:bg-blue-600',
      icon: '🎨'
    },
    {
      title: 'Nueva Noticia',
      description: 'Publicar una nueva noticia',
      href: '/admin/noticias/nuevo',
      color: 'bg-green-500 hover:bg-green-600',
      icon: '📰'
    },
    {
      title: 'Gestionar Categorías',
      description: 'Administrar categorías de proyectos',
      href: '/admin/proyectos/categorias',
      color: 'bg-purple-500 hover:bg-purple-600',
      icon: '🏷️'
    },
    {
      title: 'Ver Sitio Web',
      description: 'Abrir el sitio web en una nueva pestaña',
      href: '/',
      color: 'bg-gray-500 hover:bg-gray-600',
      icon: '👁️',
      external: true
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Resumen del contenido de tu sitio web</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Proyectos</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalProjects}</p>
            </div>
            <div className="text-blue-500 text-3xl">🎨</div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Proyectos Publicados</p>
              <p className="text-2xl font-bold text-green-900">{stats.publishedProjects}</p>
            </div>
            <div className="text-green-500 text-3xl">✅</div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">En Home</p>
              <p className="text-2xl font-bold text-purple-900">{stats.featuredProjects}</p>
            </div>
            <div className="text-purple-500 text-3xl">⭐</div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Total Noticias</p>
              <p className="text-2xl font-bold text-orange-900">{stats.totalNews}</p>
            </div>
            <div className="text-orange-500 text-3xl">📰</div>
          </div>
        </div>

        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-600 text-sm font-medium">Noticias Publicadas</p>
              <p className="text-2xl font-bold text-cyan-900">{stats.publishedNews}</p>
            </div>
            <div className="text-cyan-500 text-3xl">📝</div>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm font-medium">Noticias en Home</p>
              <p className="text-2xl font-bold text-indigo-900">{stats.homeNews}/3</p>
            </div>
            <div className="text-indigo-500 text-3xl">🏠</div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 text-sm font-medium">Total Publicaciones</p>
              <p className="text-2xl font-bold text-emerald-900">{stats.totalPublications}</p>
            </div>
            <div className="text-emerald-500 text-3xl">📚</div>
          </div>
        </div>

        <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-600 text-sm font-medium">Publicaciones Activas</p>
              <p className="text-2xl font-bold text-teal-900">{stats.publishedPublications}</p>
            </div>
            <div className="text-teal-500 text-3xl">📖</div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              target={action.external ? '_blank' : undefined}
              className={`${action.color} text-white p-6 rounded-lg transition-colors block group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{action.icon}</span>
                <svg 
                  className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
              <p className="text-sm opacity-90">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Navegación por Secciones */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Administrar Contenido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/proyectos" className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🎨</span>
              <h3 className="text-lg font-semibold">Proyectos</h3>
            </div>
            <p className="text-gray-600 text-sm">Gestiona tus proyectos artísticos, categorías y contenido</p>
          </Link>

          <Link href="/admin/noticias" className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">📰</span>
              <h3 className="text-lg font-semibold">Noticias</h3>
            </div>
            <p className="text-gray-600 text-sm">Publica y administra noticias y eventos</p>
          </Link>

          <Link href="/admin/acerca" className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">👤</span>
              <h3 className="text-lg font-semibold">Acerca</h3>
            </div>
            <p className="text-gray-600 text-sm">Edita la información de la página Acerca</p>
          </Link>

          <Link href="/admin/contacto" className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">📧</span>
              <h3 className="text-lg font-semibold">Contacto</h3>
            </div>
            <p className="text-gray-600 text-sm">Administra la información de contacto</p>
          </Link>

          <Link href="/admin/proyectos/categorias" className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🏷️</span>
              <h3 className="text-lg font-semibold">Categorías</h3>
            </div>
            <p className="text-gray-600 text-sm">Gestiona las categorías de proyectos</p>
          </Link>
        </div>
      </div>
    </div>
  );
}