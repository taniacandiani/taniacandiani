'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Publication } from '@/types';
import { PublicationStorage } from '@/lib/publicationStorage';
import { SAMPLE_PUBLICATIONS } from '@/data/content';

export default function AdminPublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([]);


  useEffect(() => {
    loadPublications();
  }, []);

  const loadPublications = () => {
    const storedPublications = PublicationStorage.getAll();
    if (storedPublications.length === 0) {
      PublicationStorage.saveAll(SAMPLE_PUBLICATIONS);
      setPublications(SAMPLE_PUBLICATIONS);
    } else {
      setPublications(storedPublications);
    }
  };



  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      PublicationStorage.remove(id);
      loadPublications();
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
  const featuredCount = publications.filter(p => p.featured && p.status === 'published').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Gestionar Publicaciones</h1>
        </div>
        <div className="flex gap-4">
          <Link
            href="/acerca"
            target="_blank"
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            👁️ Ver página
          </Link>
          <Link
            href="/admin/acerca/publicaciones/nueva"
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Nueva Publicación
          </Link>
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
          <div className="text-2xl font-bold text-purple-600">{featuredCount}</div>
          <div className="text-sm text-gray-600">Destacadas</div>
        </div>
      </div>



      {/* Publications List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {publications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay publicaciones</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primera publicación</p>
            <Link
              href="/admin/acerca/publicaciones/nueva"
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Crear Primera Publicación
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Publicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destacada
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {publications.map((publication) => (
                  <tr key={publication.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded object-cover"
                            src={publication.thumbnail}
                            alt={publication.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{publication.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(publication.publishedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(publication.status || 'draft')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {publication.featured ? (
                        <span className="text-purple-600">✓ Sí</span>
                      ) : (
                        <span className="text-gray-400">✗ No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium w-40">
                      <div className="flex items-center justify-center gap-3">
                        <a
                          href={publication.downloadLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Ver
                        </a>
                        <Link
                          href={`/admin/acerca/publicaciones/editar/${publication.id}`}
                          className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDelete(publication.id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 transition-colors"
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
    </div>
  );
}
