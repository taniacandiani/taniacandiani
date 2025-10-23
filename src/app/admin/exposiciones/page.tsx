'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Exhibition } from '@/types';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { ExhibitionCategoryStorage } from '@/lib/exhibitionCategoryStorage';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function AdminExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      setLoading(true);
      // Get all exhibitions including drafts
      const response = await fetch('/api/exhibitions?includeAll=true');
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitions');
      }
      const data = await response.json();
      setExhibitions(data);
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
      showError('Error', 'No se pudieron cargar las exposiciones');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ToastNotification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exposiciones</h1>
          <p className="text-gray-600 mt-2">Gestiona las exposiciones del sitio</p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/admin/exposiciones/categorias"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Gestionar Categorías
          </Link>
          <Link
            href="/admin/exposiciones/nueva"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nueva Exposición
          </Link>
        </div>
      </div>

      {/* Exhibitions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fechas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lugar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categorías
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {exhibitions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No hay exposiciones aún. <Link href="/admin/exposiciones/nueva" className="text-blue-600 hover:underline">Crear primera exposición</Link>
                </td>
              </tr>
            ) : (
              exhibitions.map((exhibition) => (
                <tr key={exhibition.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{exhibition.title}</div>
                    {exhibition.titleEn && (
                      <div className="text-xs text-gray-500">{exhibition.titleEn}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(exhibition.startDate)}
                      {exhibition.endDate && ` - ${formatDate(exhibition.endDate)}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{exhibition.venue || '-'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {exhibition.categories?.map((cat, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(exhibition.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}