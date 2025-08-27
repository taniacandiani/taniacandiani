'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NewsItem } from '@/types';
import { NewsStorage } from '@/lib/newsStorage';
import { NewsCategoryStorage, NewsCategory } from '@/lib/newsCategoryStorage';
import { generateSlug } from '@/lib/utils';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function NewNewsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    title: '',
    content: '',
    image: '',
    slug: '',
    categories: [],
    status: 'draft',
    tags: [],
    publishedAt: new Date().toISOString()
  });

  const [tagInput, setTagInput] = useState('');
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Migrar noticias existentes a múltiples categorías
        await NewsStorage.migrateToMultipleCategories();
        
        // Initialize categories
        const storedCategories = await NewsCategoryStorage.getAll();
        if (storedCategories.length === 0) {
          // Si no hay categorías, usar las del archivo content.ts
          const defaultCategories = [
            { id: 'exposiciones', name: 'Exposiciones', count: 0 },
            { id: 'conferencias', name: 'Conferencias', count: 0 },
            { id: 'residencias', name: 'Residencias', count: 0 },
            { id: 'talleres', name: 'Talleres', count: 0 },
            { id: 'proyectos', name: 'Proyectos', count: 0 }
          ];
          setCategories(defaultCategories);
        } else {
          setCategories(storedCategories);
        }

        // Set default categories if we don't have any
        if (!formData.categories || formData.categories.length === 0) {
          setFormData(prev => ({ 
            ...prev, 
            categories: [storedCategories[0]?.name || 'Exposiciones'].filter(Boolean) 
          }));
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        showError('Error', 'Error al cargar las categorías');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.image) {
      showError('Error de Validación', 'Por favor completa al menos el título, contenido e imagen');
      return;
    }

    if (!formData.categories || formData.categories.length === 0) {
      showError('Error de Validación', 'Debes seleccionar al menos una categoría');
      return;
    }

    try {
      // Asegurarse de que el slug se genere correctamente
      const finalSlug = formData.slug && formData.slug.trim() !== '' 
        ? formData.slug.trim() 
        : generateSlug(formData.title!);

      console.log('Debug - Slug generado:', finalSlug);
      console.log('Debug - Título:', formData.title);
      console.log('Debug - Slug del formulario:', formData.slug);

      // Generar un ID único usando timestamp + random para evitar duplicados
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newsItem: NewsItem = {
        id: uniqueId,
        title: formData.title!,
        content: formData.content!,
        image: formData.image!,
        slug: finalSlug,
        publishedAt: formData.publishedAt!,
        categories: formData.categories || [],
        author: formData.author || 'Tania Candiani',
        status: formData.status as 'published' | 'draft' | 'archived',
        tags: formData.tags || []
      };

      console.log('Debug - Noticia a guardar:', newsItem);

      await NewsStorage.save(newsItem);
      
      showSuccess('Noticia Creada', 'La noticia se ha creado exitosamente');
      
      // Limpiar el formulario
      setFormData({
        title: '',
        content: '',
        image: '',
        slug: '',
        categories: [],
        status: 'draft',
        tags: [],
        publishedAt: new Date().toISOString()
      });
      
      // Redirigir a la lista de noticias
      setTimeout(() => {
        router.push('/admin/noticias');
      }, 1500);
      
    } catch (error) {
      console.error('Error creating news:', error);
      showError('Error', 'Error al crear la noticia. Intenta de nuevo.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Nueva Noticia</h1>
          <p className="text-sm text-gray-600 mt-1">
            Crea una nueva noticia para el sitio web.
          </p>
        </div>
        <Link
          href="/admin/noticias"
          className="text-gray-600 hover:text-gray-800"
        >
          ← Volver a noticias
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Información básica</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="se-genera-automaticamente"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se genera automáticamente desde el título, pero puedes personalizarlo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías
              </label>
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <div className="text-sm text-gray-500">Cargando categorías...</div>
                ) : (
                  categories.map(cat => (
                    <label key={cat.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.categories?.includes(cat.name) || false}
                        onChange={(e) => {
                          const currentCategories = formData.categories || [];
                          if (e.target.checked) {
                            setFormData({ 
                              ...formData, 
                              categories: [...currentCategories, cat.name]
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              categories: currentCategories.filter(c => c !== cat.name)
                            });
                          }
                        }}
                        className="rounded focus:ring-black"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </label>
                  ))
                )}
              </div>
              {(!formData.categories || formData.categories.length === 0) && (
                <p className="text-sm text-red-500 mt-1">Debes seleccionar al menos una categoría</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                <Link 
                  href="/admin/noticias/categorias" 
                  className="text-blue-600 hover:text-blue-800"
                >
                  Gestionar categorías →
                </Link>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Imagen de la Noticia */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Imagen de la Noticia</h2>
          
          <div className="space-y-4">
            <ImageUploader
              label="Imagen Principal"
              projectId={formData.slug || 'noticia-sin-titulo'}
              currentImage={formData.image}
              onImageUpload={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
              required={true}
              contentType="noticias"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contenido</h2>
          
          <div>
            <RichTextEditor
              label="Contenido completo *"
              value={formData.content || ''}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Escribe el contenido completo del artículo aquí..."
              height={300}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Etiquetas</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Escribe una etiqueta y presiona Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
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
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/noticias"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Crear Noticia
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
