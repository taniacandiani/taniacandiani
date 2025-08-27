'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { NewsItem, NewsCategory } from '@/types';
import { NewsStorage } from '@/lib/newsStorage';
import { NewsCategoryStorage } from '@/lib/newsCategoryStorage';
import { NEWS_CATEGORIES } from '@/data/content';
import { generateSlug } from '@/lib/utils';
import RichTextEditor from '@/components/ui/RichTextEditor';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditNewsPage({ params }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    title: '',
    description: '',
    content: '',
    image: '/fondo1.jpg',
    category: '',
    author: 'Tania Candiani',
    status: 'draft',
    showInHome: false,
    tags: [],
    featured: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    async function loadNews() {
      const resolvedParams = await params;
      const newsItem = NewsStorage.getById(resolvedParams.id);
      
      if (!newsItem) {
        alert('Noticia no encontrada');
        router.push('/admin/noticias');
        return;
      }

      setFormData(newsItem);

      // Initialize categories
      const storedCategories = NewsCategoryStorage.getAll();
      if (storedCategories.length === 0) {
        NewsCategoryStorage.saveAll(NEWS_CATEGORIES);
        setCategories(NEWS_CATEGORIES);
      } else {
        setCategories(storedCategories);
      }

      if (!newsItem.category && storedCategories.length > 0) {
        setFormData(prev => ({ ...prev, category: storedCategories[0].name }));
      }

      setLoading(false);
    }

    loadNews();
  }, [params, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!formData.title || !formData.description) {
        alert('Por favor completa todos los campos requeridos');
        setSaving(false);
        return;
      }

      const slug = generateSlug(formData.title);
      const publishedAt = formData.publishedAt || new Date().toISOString();

      const newsItem: NewsItem = {
        ...formData as NewsItem,
        slug,
        publishedAt,
        tags: formData.tags || []
      };

      NewsStorage.save(newsItem);
      
      alert('Noticia actualizada correctamente');
      router.push('/admin/noticias');
    } catch (error) {
      console.error('Error al actualizar la noticia:', error);
      alert('Error al actualizar la noticia');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Editar Noticia</h1>
          <p className="text-sm text-gray-600 mt-1">
            Modifica los datos de la noticia seleccionada
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/noticias')}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Volver
        </button>
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

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {/* Contenido completo */}
          <div>
            <RichTextEditor
              label="Contenido completo"
              value={formData.content || ''}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Escribe el contenido completo del artículo aquí..."
              height={300}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
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

            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen
              </label>
              <select
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="/fondo1.jpg">Fondo 1</option>
                <option value="/fondo2.jpg">Fondo 2</option>
                <option value="/fondo3.jpg">Fondo 3</option>
              </select>
            </div>
          </div>

          {/* Vista previa de imagen */}
          {formData.image && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vista previa
              </label>
              <div className="relative w-48 h-24 rounded-md overflow-hidden border border-gray-300">
                <Image
                  src={formData.image}
                  alt="Vista previa"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}

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

          {/* Opciones de visualización */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showInHome"
                checked={formData.showInHome}
                onChange={(e) => setFormData({ ...formData, showInHome: e.target.checked })}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="showInHome" className="ml-2 block text-sm text-gray-900">
                Mostrar en página de inicio
              </label>
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
                Noticia destacada
              </label>
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
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Actualizar Noticia'}
          </button>
        </div>
      </form>
    </div>
  );
}
