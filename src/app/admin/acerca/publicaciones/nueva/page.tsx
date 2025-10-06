'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Publication } from '@/types';
import { PublicationStorage } from '@/lib/publicationStorage';
import ImageUploader from '@/components/ui/ImageUploader';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function NewPublicationPage() {
  const router = useRouter();
  const { showSuccess, showError, notification, hideNotification } = useNotification();
  const [isEnglish, setIsEnglish] = useState(false);
  const [formData, setFormData] = useState<Partial<Publication>>({
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    thumbnail: '/fondo1.jpg',
    downloadLink: '',
    status: 'draft'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      showError('Error de Validación', 'Por favor completa al menos el título y la descripción');
      return;
    }

    try {
      const publication: Publication = {
        id: PublicationStorage.generateId(),
        title: formData.title!,
        titleEn: formData.titleEn,
        description: formData.description!,
        descriptionEn: formData.descriptionEn,
        thumbnail: formData.thumbnail!,
        downloadLink: formData.downloadLink || '#',
        publishedAt: new Date().toISOString(),
        status: formData.status as 'published' | 'draft'
      };

      await PublicationStorage.save(publication);

      // Mostrar mensaje de éxito
      showSuccess('Publicación Creada', 'La publicación se ha creado exitosamente');

      // Redirigir a la lista de publicaciones después de un breve retraso
      setTimeout(() => {
        router.push('/admin/acerca/publicaciones');
      }, 1500);
    } catch (error) {
      console.error('Error creating publication:', error);
      showError('Error al Crear', 'Ha ocurrido un error al crear la publicación. Intenta de nuevo.');
    }
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
      <div className="flex justify-between items-center gap-4 mb-8 pt-4 border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={() => setIsEnglish(!isEnglish)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {isEnglish ? 'Español' : 'English'}
        </button>

        <div className="flex gap-4">
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
      </div>

      <form id="publication-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isEnglish ? 'Basic Information (English)' : 'Información Básica (Español)'}
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEnglish ? 'Title (English) *' : 'Título (Español) *'}
              </label>
              <input
                type="text"
                value={isEnglish ? formData.titleEn : formData.title}
                onChange={(e) => setFormData({
                  ...formData,
                  [isEnglish ? 'titleEn' : 'title']: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={isEnglish ? "Publication title in English" : "Título de la publicación"}
                required={!isEnglish}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEnglish ? 'Description (English) *' : 'Descripción (Español) *'}
              </label>
              <textarea
                value={isEnglish ? formData.descriptionEn : formData.description}
                onChange={(e) => setFormData({
                  ...formData,
                  [isEnglish ? 'descriptionEn' : 'description']: e.target.value
                })}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={isEnglish ? "Publication description in English..." : "Descripción de la publicación..."}
                required={!isEnglish}
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
                projectId="new-publication"
                currentImage={formData.thumbnail}
                onImageUpload={(imageUrl) => setFormData({ ...formData, thumbnail: imageUrl })}
                required={false}
                contentType="acerca"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace de descarga
              </label>
              <input
                type="text"
                value={formData.downloadLink}
                onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://ejemplo.com/archivo.pdf o #"
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
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
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
