'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { NewsItem } from '@/types';
import { NewsStorage } from '@/lib/newsStorage';
import { NewsCategoryStorage, NewsCategory } from '@/lib/newsCategoryStorage';
import { NEWS_CATEGORIES } from '@/data/content';
import { generateSlug } from '@/lib/utils';

export default function NewNewsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [formData, setFormData] = useState<Partial<NewsItem>>({
    title: '',
    description: '',
    content: '',
    image: '',
    slug: '',
    category: '',
    status: 'draft',
    showInHome: false,
    featured: false,
    tags: [],
    publishedAt: new Date().toISOString()
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    // Initialize categories
    const storedCategories = NewsCategoryStorage.getAll();
    if (storedCategories.length === 0) {
      NewsCategoryStorage.saveAll(NEWS_CATEGORIES);
      setCategories(NEWS_CATEGORIES);
    } else {
      setCategories(storedCategories);
    }

    // Set default category if we don't have one
    if (!formData.category && storedCategories.length > 0) {
      setFormData(prev => ({ ...prev, category: storedCategories[0].name }));
    }
  }, [formData.category]);



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

  const validateHomeLimit = (showInHome: boolean) => {
    if (!showInHome) return true;
    
    const currentHomeNews = NewsStorage.getForHome();
    return currentHomeNews.length < 3;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.image) {
      alert('Por favor completa al menos el título, descripción e imagen');
      return;
    }

    if (formData.showInHome && !validateHomeLimit(true)) {
      alert('Ya hay 3 noticias seleccionadas para mostrar en el inicio. Deselecciona alguna primero.');
      return;
    }

    const newsItem: NewsItem = {
      id: Date.now().toString(),
      title: formData.title!,
      description: formData.description!,
      content: formData.content || formData.description!,
      image: formData.image!,
      slug: formData.slug || generateSlug(formData.title!),
      publishedAt: formData.publishedAt!,
      category: formData.category,
      author: formData.author,
      status: formData.status as 'published' | 'draft' | 'archived',
      showInHome: formData.showInHome,
      featured: formData.featured,
      tags: formData.tags || []
    };

    NewsStorage.save(newsItem);
    router.push('/admin/noticias');
  };

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

            <div className="md:col-span-2">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen *
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="/path/to/image.jpg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              >
                {categories.length === 0 ? (
                  <option value="">Cargando categorías...</option>
                ) : (
                  categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))
                )}
              </select>
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

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contenido</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido completo
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={8}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Contenido completo del artículo (opcional, se usará la descripción si está vacío)"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Opciones de visualización</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showInHome"
                checked={formData.showInHome}
                onChange={(e) => {
                  if (e.target.checked && !validateHomeLimit(true)) {
                    alert('Ya hay 3 noticias seleccionadas para mostrar en el inicio. Deselecciona alguna primero.');
                    return;
                  }
                  setFormData({ ...formData, showInHome: e.target.checked });
                }}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <label htmlFor="showInHome" className="ml-2 text-sm text-gray-700">
                Mostrar en la página de inicio (máximo 3)
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
              <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                Noticia destacada
              </label>
            </div>
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
    </div>
  );
}
