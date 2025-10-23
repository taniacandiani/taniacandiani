'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Publication } from '@/types';
import { PublicationStorage } from '@/lib/publicationStorage';
import { SAMPLE_PUBLICATIONS } from '@/data/content';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';
import { generateNewsExcerpt } from '@/lib/utils';

export default function AdminPublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [filteredPublications, setFilteredPublications] = useState<Publication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<Publication | null>(null);
  const { showSuccess, showError, notification, hideNotification} = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await loadPublications();
      } catch (error) {
        console.error('Error initializing publications data:', error);
        // Fallback to static content
        setPublications(SAMPLE_PUBLICATIONS);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadPublications = async () => {
    try {
      const storedPublications = await PublicationStorage.getAll();
      if (storedPublications.length === 0) {
        // Note: saveAll is not implemented in the new async version
        // We'll rely on the JSON files for now
        console.log('Using default publications from content.ts');
        setPublications(SAMPLE_PUBLICATIONS);
      } else {
        setPublications(storedPublications);
      }
    } catch (error) {
      console.error('Error loading publications:', error);
      // Fallback to static content
      setPublications(SAMPLE_PUBLICATIONS);
    }
  };

  useEffect(() => {
    let filtered = publications;

    if (searchTerm) {
      filtered = filtered.filter(p => {
        const title = (p.title || '').toLowerCase();
        const titleEn = (p.titleEn || '').toLowerCase();
        const description = (p.description || '').toLowerCase();
        const descriptionEn = (p.descriptionEn || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return title.includes(searchLower) ||
               titleEn.includes(searchLower) ||
               description.includes(searchLower) ||
               descriptionEn.includes(searchLower);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredPublications(filtered);
  }, [searchTerm, statusFilter, publications]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      try {
        await PublicationStorage.remove(id);
        await loadPublications();
        showSuccess('Publicación Eliminada', 'La publicación se ha eliminado correctamente');
      } catch (error) {
        console.error('Error deleting publication:', error);
        showError('Error al Eliminar', 'Ha ocurrido un error al eliminar la publicación');
      }
    }
  };

  const handleDragStart = (publication: Publication) => {
    setDraggedItem(publication);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetPublication: Publication) => {
    if (!draggedItem || draggedItem.id === targetPublication.id) {
      setDraggedItem(null);
      return;
    }

    const items = [...filteredPublications];
    const draggedIndex = items.findIndex(p => p.id === draggedItem.id);
    const targetIndex = items.findIndex(p => p.id === targetPublication.id);

    // Reorder array
    items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, draggedItem);

    // Update display_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    setFilteredPublications(updatedItems);
    setPublications(updatedItems);

    // Save new order to backend
    try {
      await fetch('/api/publications/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publications: updatedItems.map((p, index) => ({ id: p.id, displayOrder: index }))
        })
      });

      showSuccess('Orden Actualizado', 'El orden de las publicaciones se ha guardado correctamente');
    } catch (error) {
      console.error('Error updating order:', error);
      showError('Error', 'No se pudo guardar el orden');
      await loadPublications();
    }

    setDraggedItem(null);
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
      draft: { label: 'Borrador', className: 'bg-yellow-100 text-yellow-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const publishedCount = publications.filter(p => p.status === 'published').length;
  const draftCount = publications.filter(p => p.status === 'draft').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Publicaciones</h1>
          <p className="text-sm text-gray-600">
            Gestiona las publicaciones que aparecen en la página "Acerca".
          </p>
        </div>
        <Link
          href="/admin/acerca/publicaciones/nueva"
          className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Nueva Publicación
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar publicaciones..."
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
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{publications.length}</div>
          <div className="text-sm text-gray-600">Total publicaciones</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{publishedCount}</div>
          <div className="text-sm text-gray-600">Publicadas</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{draftCount}</div>
          <div className="text-sm text-gray-600">Borradores</div>
        </div>
      </div>

      {/* Publications List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Cargando publicaciones...</p>
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No se encontraron publicaciones.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900 w-12"></th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Título</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Estado</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Fecha</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPublications.map((publication) => (
                  <tr
                    key={publication.id}
                    draggable
                    onDragStart={() => handleDragStart(publication)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(publication)}
                    className={`hover:bg-gray-50 cursor-move ${draggedItem?.id === publication.id ? 'opacity-50' : ''}`}
                  >
                    <td className="py-4 px-6">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </td>
                    <td className="py-4 px-6">
                      <Link href={`/admin/acerca/publicaciones/editar/${publication.id}`} className="block hover:text-blue-600">
                        <div className="font-medium text-gray-900 hover:underline">{publication.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {generateNewsExcerpt(publication.description, 80)}
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(publication.status || 'draft')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {formatDate(publication.publishedAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <a
                          href={publication.downloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </a>
                        <Link
                          href={`/admin/acerca/publicaciones/editar/${publication.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(publication.id)}
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
