'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NewsItem } from '@/types';
import { NewsStorage } from '@/lib/newsStorage';
import { SAMPLE_NEWS } from '@/data/content';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';
import { generateNewsExcerpt } from '@/lib/utils';

export default function AdminNoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Migrar noticias existentes a múltiples categorías
        await NewsStorage.migrateToMultipleCategories();
        await loadNews();
      } catch (error) {
        console.error('Error initializing news data:', error);
        // Fallback to static content
        setNews(SAMPLE_NEWS);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadNews = async () => {
    try {
      // Migrar noticias existentes a múltiples categorías
      await NewsStorage.migrateToMultipleCategories();

      const storedNews = await NewsStorage.getAllIncludingDrafts();
      if (storedNews.length === 0) {
        // Note: saveAll is not implemented in the new async version
        // We'll rely on the JSON files for now
        console.log('Using default news from content.ts');
        setNews(SAMPLE_NEWS);
      } else {
        setNews(storedNews);
      }
    } catch (error) {
      console.error('Error loading news:', error);
      // Fallback to static content
      setNews(SAMPLE_NEWS);
    }
  };

  useEffect(() => {
    let filtered = news;

    if (searchTerm) {
      filtered = filtered.filter(n => {
        const title = (n.title || '').toLowerCase();
        const content = (n.content || '').toLowerCase();
        const titleEn = (n.titleEn || '').toLowerCase();
        const contentEn = (n.contentEn || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return title.includes(searchLower) ||
               content.includes(searchLower) ||
               titleEn.includes(searchLower) ||
               contentEn.includes(searchLower);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    setFilteredNews(filtered);
  }, [searchTerm, statusFilter, news]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      try {
        await NewsStorage.remove(id);
        await loadNews();
        showSuccess('Noticia Eliminada', 'La noticia se ha eliminado correctamente');
      } catch (error) {
        console.error('Error deleting news:', error);
        showError('Error al Eliminar', 'Ha ocurrido un error al eliminar la noticia');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newsItem = news.find(n => n.id === id);
    if (newsItem) {
      try {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        await NewsStorage.save({ ...newsItem, status: newStatus as 'published' | 'draft' | 'archived' });
        await loadNews();
        const statusText = newStatus === 'published' ? 'publicada' : 'enviada a borrador';
        showSuccess('Estado Cambiado', `La noticia ha sido ${statusText}`);
      } catch (error) {
        console.error('Error toggling news status:', error);
        showError('Error al Cambiar Estado', 'Ha ocurrido un error al cambiar el estado de la noticia');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: 'Publicado', className: 'bg-green-100 text-green-800' },
      draft: { label: 'Borrador', className: 'bg-yellow-100 text-yellow-800' },
      archived: { label: 'Archivado', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Noticias</h1>
          <p className="text-sm text-gray-600">
            Gestiona las noticias del sitio web. Las 3 noticias más recientes (por fecha de creación) se muestran automáticamente en el inicio.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/noticias/categorias"
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Gestionar Categorías
          </Link>
          <Link
            href="/admin/noticias/nueva"
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Nueva Noticia
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar noticias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">Todos los estados</option>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{news.length}</div>
          <div className="text-sm text-gray-600">Total noticias</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {news.filter(n => n.status === 'published').length}
          </div>
          <div className="text-sm text-gray-600">Publicadas</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {news.filter(n => n.status === 'draft').length}
          </div>
          <div className="text-sm text-gray-600">Borradores</div>
        </div>
      </div>

      {/* News List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Cargando noticias...</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No se encontraron noticias.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Título</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Categoría</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Estado</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Fecha</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNews.map((newsItem) => (
                  <tr key={newsItem.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <Link href={`/admin/noticias/editar/${newsItem.id}`} className="block hover:text-blue-600">
                        <div className="font-medium text-gray-900 hover:underline">{newsItem.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {generateNewsExcerpt(newsItem.content, 80)}
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {newsItem.categories && newsItem.categories.length > 0
                        ? newsItem.categories.join(', ')
                        : '-'}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(newsItem.status || 'draft')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {formatDate(newsItem.createdAt || newsItem.publishedAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/noticias/${newsItem.slug}`}
                          target="_blank"
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/noticias/editar/${newsItem.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(newsItem.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Notification Component */}
      <ToastNotification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}
