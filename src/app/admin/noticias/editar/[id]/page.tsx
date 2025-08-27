'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { NewsItem, NewsCategory } from '@/types';
import { NewsStorage } from '@/lib/newsStorage';
import { NewsCategoryStorage } from '@/lib/newsCategoryStorage';
import { NEWS_CATEGORIES } from '@/data/content';
import { generateSlug } from '@/lib/utils';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditNewsPage({ params }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    title: '',
    content: '',
    image: '/fondo1.jpg',
    categories: [],
    author: 'Tania Candiani',
    status: 'draft',
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    async function loadNews() {
      try {
        const resolvedParams = await params;
        const newsItem = await NewsStorage.getById(resolvedParams.id);
        
        if (!newsItem) {
          showError('Noticia No Encontrada', 'La noticia solicitada no existe');
          router.push('/admin/noticias');
          return;
        }

        setFormData(newsItem);

        // Migrar noticias existentes a múltiples categorías
        await NewsStorage.migrateToMultipleCategories();
        
        // Initialize categories
        const storedCategories = await NewsCategoryStorage.getAll();
        if (storedCategories.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default categories from content.ts');
          setCategories(NEWS_CATEGORIES);
        } else {
          setCategories(storedCategories);
        }

        if (!newsItem.categories && storedCategories.length > 0) {
          setFormData(prev => ({ ...prev, categories: [storedCategories[0].name] }));
        }
      } catch (error) {
        console.error('Error loading news:', error);
        showError('Error al Cargar', 'Ha ocurrido un error al cargar la noticia');
        router.push('/admin/noticias');
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, [params, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setSaving(true);

    try {
      if (!formData.title || !formData.content) {
        showError('Error de Validación', 'Por favor completa todos los campos requeridos');
        setSaving(false);
        return;
      }

      if (!formData.categories || formData.categories.length === 0) {
        showError('Error de Validación', 'Debes seleccionar al menos una categoría');
        setSaving(false);
        return;
      }

      // Validar que haya una imagen
      if (!formData.image || formData.image.trim() === '') {
        showError('Error de Validación', 'Debes agregar una imagen para la noticia');
        setSaving(false);
        return;
      }

      const slug = generateSlug(formData.title);
      const publishedAt = formData.publishedAt || new Date().toISOString();

      // Asegurar que todos los campos requeridos estén presentes
      const newsItem: NewsItem = {
        ...formData as NewsItem,
        id: formData.id || '',
        title: formData.title || '',
        content: formData.content || '',
        image: formData.image || '',
        slug,
        publishedAt,
        categories: formData.categories || [],
        author: formData.author || 'Tania Candiani',
        status: formData.status || 'draft',
        tags: formData.tags || []
      };

      console.log('Noticia a actualizar:', newsItem);

      await NewsStorage.update(newsItem);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('newsUpdated', { detail: newsItem }));
      
      // Show success message without redirecting
      showSuccess('Noticia Actualizada', 'La noticia se ha actualizado correctamente');
      // Stay in the editor - don't redirect
    } catch (error) {
      console.error('Error al actualizar la noticia:', error);
      showError('Error al Actualizar', 'Ha ocurrido un error al actualizar la noticia');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-500">Cargando noticia...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar Noticia</h1>
          <p className="text-sm text-gray-600 mt-1">
            Modifica los datos de la noticia seleccionada
          </p>
        </div>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex justify-between items-center mb-8 pt-4 border-b border-gray-200 pb-4">
        <Link
          href={`/noticias/${formData.slug}`}
          target="_blank"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Ver Noticia
        </Link>
        
        <div className="flex gap-4">
          <Link
            href="/admin/noticias"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Título */}
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



          {/* Contenido completo */}
          <div>
            <RichTextEditor
              label="Contenido completo *"
              value={formData.content || ''}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Escribe el contenido completo del artículo aquí..."
              height={300}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categorías */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías
              </label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.categories?.includes(category.name) || false}
                      onChange={(e) => {
                        const currentCategories = formData.categories || [];
                        if (e.target.checked) {
                          setFormData({ 
                            ...formData, 
                            categories: [...currentCategories, category.name]
                          });
                        } else {
                          setFormData({ 
                            ...formData, 
                            categories: currentCategories.filter(c => c !== category.name)
                          });
                        }
                      }}
                      className="rounded focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
              {(!formData.categories || formData.categories.length === 0) && (
                <p className="text-sm text-red-500 mt-1">Debes seleccionar al menos una categoría</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' | 'archived' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>


          </div>

          {/* Imagen de la Noticia */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagen de la Noticia</h2>
            
            <div className="space-y-4">
              <ImageUploader
                label="Imagen Principal"
                projectId={formData.slug || formData.id || 'noticia-sin-titulo'}
                currentImage={formData.image}
                onImageUpload={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
                required={true}
                contentType="noticias"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Etiquetas
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Agregar etiqueta..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Agregar
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>


        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/noticias')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center"
          >
            {saving && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
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
