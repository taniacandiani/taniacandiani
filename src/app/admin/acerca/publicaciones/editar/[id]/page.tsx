'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Publication } from '@/types';
import { PublicationStorage } from '@/lib/publicationStorage';
import ImageUploader from '@/components/ui/ImageUploader';

export default function EditPublicationPage() {
  const router = useRouter();
  const params = useParams();
  const [publication, setPublication] = useState<Publication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPublication = async () => {
      const id = params.id as string;
      if (id) {
        try {
          const foundPublication = await PublicationStorage.getById(id);
          if (foundPublication) {
            setPublication(foundPublication);
          } else {
            router.push('/admin/acerca/publicaciones');
          }
        } catch (error) {
          console.error('Error loading publication:', error);
          router.push('/admin/acerca/publicaciones');
        }
      }
      setLoading(false);
    };

    loadPublication();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publication) return;

    setSaving(true);
    try {
      await PublicationStorage.save(publication);
      
      // Show success message without redirecting
      alert('Publicación actualizada correctamente');
      // Stay in the editor - don't redirect
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar la publicación');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando publicación...</div>
      </div>
    );
  }

  if (!publication) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Publicación no encontrada</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar Publicación</h1>
          <p className="text-gray-600">Edita los detalles de la publicación "{publication.title}"</p>
        </div>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex justify-end gap-4 mb-8 pt-4 border-b border-gray-200 pb-4">
        <Link
          href="/admin/acerca/publicaciones"
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          form="publication-form"
          disabled={saving}
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <form id="publication-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={publication.title}
                onChange={(e) => setPublication({ ...publication, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={publication.description}
                onChange={(e) => setPublication({ ...publication, description: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>
        </div>

        {/* Imagen y Enlaces */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagen y Enlaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ImageUploader
                label="Imagen de portada"
                projectId={publication.id}
                currentImage={publication.thumbnail}
                onImageUpload={(imageUrl) => setPublication({ ...publication, thumbnail: imageUrl })}
                required={false}
                contentType="acerca"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace de descarga
              </label>
              <input
                type="url"
                value={publication.downloadLink}
                onChange={(e) => setPublication({ ...publication, downloadLink: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://ejemplo.com/archivo.pdf"
              />
            </div>
          </div>
        </div>

        {/* Configuración */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={publication.status || 'draft'}
                onChange={(e) => setPublication({ ...publication, status: e.target.value as 'published' | 'draft' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Información de Fecha */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Publicación</h2>
          <div className="text-sm text-gray-600">
            <p><strong>Fecha de creación:</strong> {new Date(publication.publishedAt).toLocaleString('es-ES')}</p>
          </div>
        </div>

        {/* Botones - Bottom */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Link
            href="/admin/acerca/publicaciones"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
