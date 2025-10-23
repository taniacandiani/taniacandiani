'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProjectStorage } from '@/lib/projectStorage';
import { NewsStorage } from '@/lib/newsStorage';
import { PublicationStorage } from '@/lib/publicationStorage';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { PROJECTS, SAMPLE_NEWS, SAMPLE_PUBLICATIONS } from '@/data/content';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalNews: 0,
    totalExhibitions: 0,
    totalPublications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Initialize with existing projects if storage is empty
        const storedProjects = await ProjectStorage.getAll();
        if (storedProjects.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default projects from content.ts');
        }

        // Initialize with existing news if storage is empty
        const storedNews = await NewsStorage.getAll();
        if (storedNews.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default news from content.ts');
        }

        // Initialize with existing publications if storage is empty
        const storedPublications = await PublicationStorage.getAll();
        if (storedPublications.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default publications from content.ts');
        }

        const projects = await ProjectStorage.getAll();
        const news = await NewsStorage.getAllIncludingDrafts();
        const exhibitions = await ExhibitionStorage.getAllIncludingDrafts();
        const publications = await PublicationStorage.getAll();

        setStats({
          totalProjects: projects.length,
          totalNews: news.length,
          totalExhibitions: exhibitions.length,
          totalPublications: publications.length
        });
      } catch (error) {
        console.error('Error initializing admin data:', error);
        // Fallback to static content
        setStats({
          totalProjects: PROJECTS.length,
          totalNews: SAMPLE_NEWS.length,
          totalExhibitions: 0,
          totalPublications: SAMPLE_PUBLICATIONS.length
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Resumen del contenido de tu sitio web</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Cerrar Sesión
        </button>
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

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Total Noticias</p>
              <p className="text-2xl font-bold text-orange-900">{stats.totalNews}</p>
            </div>
            <div className="text-orange-500 text-3xl">📰</div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Exposiciones</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalExhibitions}</p>
            </div>
            <div className="text-purple-500 text-3xl">🖼️</div>
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
      </div>

      {/* Navegación por Secciones */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Administrar Contenido</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

          <Link href="/admin/exposiciones" className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🖼️</span>
              <h3 className="text-lg font-semibold">Exposiciones</h3>
            </div>
            <p className="text-gray-600 text-sm">Gestiona exposiciones y eventos artísticos</p>
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
              <h3 className="text-lg font-semibold">Categorías de Proyectos</h3>
            </div>
            <p className="text-gray-600 text-sm">Gestiona las categorías de proyectos</p>
          </Link>

          <Link href="/admin/noticias/categorias" className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🏷️</span>
              <h3 className="text-lg font-semibold">Categorías de Noticias</h3>
            </div>
            <p className="text-gray-600 text-sm">Gestiona las categorías de noticias</p>
          </Link>

          <Link href="/admin/exposiciones/categorias" className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center mb-3">
              <span className="text-2xl mr-3">🏷️</span>
              <h3 className="text-lg font-semibold">Categorías de Exposiciones</h3>
            </div>
            <p className="text-gray-600 text-sm">Gestiona las categorías de exposiciones</p>
          </Link>
        </div>
      </div>
    </div>
  );
}