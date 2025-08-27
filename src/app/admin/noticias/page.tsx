'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NewsItem } from '@/types';
import { NewsStorage } from '@/lib/newsStorage';
import { SAMPLE_NEWS } from '@/data/content';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function AdminNoticiasPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [homeNewsCount, setHomeNewsCount] = useState(0);
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
        setHomeNewsCount(SAMPLE_NEWS.filter(n => n.status === 'published').length);
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
      
      const storedNews = await NewsStorage.getAll();
      if (storedNews.length === 0) {
        // Note: saveAll is not implemented in the new async version
        // We'll rely on the JSON files for now
        console.log('Using default news from content.ts');
        setNews(SAMPLE_NEWS);
        setHomeNewsCount(SAMPLE_NEWS.filter(n => n.status === 'published').length);
      } else {
        setNews(storedNews);
        const homeNews = await NewsStorage.getForHome();
        setHomeNewsCount(homeNews.length);
      }
    } catch (error) {
      console.error('Error loading news:', error);
      // Fallback to static content
      setNews(SAMPLE_NEWS);
      setHomeNewsCount(SAMPLE_NEWS.filter(n => n.status === 'published').length);
    }
  };

  useEffect(() => {
    let filtered = news;

    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Administrar Noticias</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona las noticias del sitio web. Las últimas 3 noticias publicadas se muestran automáticamente en el inicio.
          </p>
        </div>
        <Link
          href="/admin/noticias/nueva"
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Nueva Noticia
        </Link>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{homeNewsCount}</div>
          <div className="text-sm text-gray-600">En inicio</div>
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
                  <th className="text-left py-4 px-6 font-medium text-gray-900">En inicio</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNews.map((newsItem) => (
                  <tr key={newsItem.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{newsItem.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {newsItem.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {newsItem.category || '-'}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(newsItem.status || 'draft')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {formatDate(newsItem.publishedAt)}
                    </td>
                    <td className="py-4 px-6">
                      {news.filter(n => n.status === 'published').slice(0, 3).some(n => n.id === newsItem.id) ? (
                        <span className="text-green-600 text-sm">✓ Sí</span>
                      ) : (
                        <span className="text-gray-400 text-sm">No</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/noticias/editar/${newsItem.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleToggleStatus(newsItem.id, newsItem.status || 'draft')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          {newsItem.status === 'published' ? 'Despublicar' : 'Publicar'}
                        </button>
                        <Link
                          href={`/noticias/${newsItem.slug}`}
                          target="_blank"
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => handleDelete(newsItem.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Eliminar
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
