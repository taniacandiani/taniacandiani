'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Exhibition } from '@/types';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { ExhibitionCategoryStorage } from '@/lib/exhibitionCategoryStorage';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';
import { generateNewsExcerpt } from '@/lib/utils';

export default function AdminExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [filteredExhibitions, setFilteredExhibitions] = useState<Exhibition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      // Get all exhibitions including drafts
      const data = await ExhibitionStorage.getAllIncludingDrafts();
      setExhibitions(data);
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      showError('Error', 'No se pudieron cargar las exposiciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = exhibitions;

    if (searchTerm) {
      filtered = filtered.filter(e => {
        const title = (e.title || '').toLowerCase();
        const content = (e.content || '').toLowerCase();
        const titleEn = (e.titleEn || '').toLowerCase();
        const contentEn = (e.contentEn || '').toLowerCase();
        const venue = (e.venue || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return title.includes(searchLower) ||
               content.includes(searchLower) ||
               titleEn.includes(searchLower) ||
               contentEn.includes(searchLower) ||
               venue.includes(searchLower);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    setFilteredExhibitions(filtered);
  }, [searchTerm, statusFilter, exhibitions]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta exposición?')) {
      return;
    }

    try {
      const success = await ExhibitionStorage.delete(id);
      if (success) {
        // Update category counts after deleting exhibition
        await ExhibitionCategoryStorage.updateCounts();

        showSuccess('Éxito', 'Exposición eliminada correctamente');
        fetchExhibitions();
      } else {
        showError('Error', 'No se pudo eliminar la exposición');
      }
    } catch (error) {
      console.error('Error deleting exhibition:', error);
      showError('Error', 'Error al eliminar la exposición');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'published') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Publicado</span>;
    } else if (status === 'draft') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Borrador</span>;
    } else {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Archivado</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Exposiciones</h1>
          <p className="text-sm text-gray-600">
            Gestiona las exposiciones del sitio web. Las exposiciones con fecha de inicio y que no hayan terminado se muestran en el inicio.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/exposiciones/categorias"
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Gestionar Categorías
          </Link>
          <Link
            href="/admin/exposiciones/nueva"
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Nueva Exposición
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar exposiciones..."
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
          <div className="text-2xl font-bold text-gray-900">{exhibitions.length}</div>
          <div className="text-sm text-gray-600">Total exposiciones</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {exhibitions.filter(e => e.status === 'published').length}
          </div>
          <div className="text-sm text-gray-600">Publicadas</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {exhibitions.filter(e => e.status === 'draft').length}
          </div>
          <div className="text-sm text-gray-600">Borradores</div>
        </div>
      </div>

      {/* Exhibitions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Cargando exposiciones...</p>
          </div>
        ) : filteredExhibitions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No se encontraron exposiciones.</p>
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
                {filteredExhibitions.map((exhibition) => (
                  <tr key={exhibition.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <Link href={`/admin/exposiciones/editar/${exhibition.id}`} className="block hover:text-blue-600">
                        <div className="font-medium text-gray-900 hover:underline">{exhibition.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {generateNewsExcerpt(exhibition.content, 80)}
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {exhibition.categories && exhibition.categories.length > 0
                        ? exhibition.categories.join(', ')
                        : '-'}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(exhibition.status)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {exhibition.startDate && exhibition.endDate ? (
                        <>{formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}</>
                      ) : exhibition.startDate ? (
                        formatDate(exhibition.startDate)
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/exposiciones/${exhibition.slug}`}
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
                        href={`/admin/exposiciones/editar/${exhibition.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDelete(exhibition.id)}
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