'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Publication } from '@/types';
import { PublicationStorage } from '@/lib/publicationStorage';

export default function NewPublicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Publication>>({
    title: '',
    description: '',
    thumbnail: '/fondo1.jpg',
    downloadLink: '',
    status: 'draft',
    featured: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      alert('Por favor completa al menos el título y la descripción');
      return;
    }

    const publication: Publication = {
      id: `pub-${Date.now()}`,
      title: formData.title!,
      description: formData.description!,
      thumbnail: formData.thumbnail!,
      downloadLink: formData.downloadLink || '#',
      publishedAt: new Date().toISOString(),
      status: formData.status as 'published' | 'draft',
      featured: formData.featured!
    };

    PublicationStorage.save(publication);
    router.push('/admin/acerca/publicaciones');
  };

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva Publicación</h1>
          <p className="text-gray-600">Crea una nueva publicación para la página "Acerca"</p>
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
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Crear Publicación
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
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Descripción de la publicación..."
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen de portada
              </label>
              <select
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="/fondo1.jpg">Fondo 1</option>
                <option value="/fondo2.jpg">Fondo 2</option>
                <option value="/fondo3.jpg">Fondo 3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace de descarga
              </label>
              <input
                type="url"
                value={formData.downloadLink}
                onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://ejemplo.com/archivo.pdf"
              />
            </div>
          </div>
        </div>

        {/* Configuración */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                Publicación destacada
              </label>
            </div>
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
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Crear Publicación
          </button>
        </div>
      </form>
    </div>
  );
}
