'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Exhibition, ExhibitionCategory } from '@/types';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { ExhibitionCategoryStorage } from '@/lib/exhibitionCategoryStorage';
import { generateSlug } from '@/lib/utils';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function EditExhibitionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [categories, setCategories] = useState<ExhibitionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnglish, setIsEnglish] = useState(false);
  const [formData, setFormData] = useState<Partial<Exhibition>>({
    title: '',
    titleEn: '',
    content: '',
    contentEn: '',
    image: '',
    slug: '',
    venue: '',
    venueEn: '',
    startDate: '',
    endDate: '',
    curator: '',
    curatorEn: '',
    categories: [],
    status: 'draft',
    tags: [],
    heroImages: [],
    externalLink: '',
    publishedAt: new Date().toISOString()
  });

  const [tagInput, setTagInput] = useState('');
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Get exhibition data
        const exhibition = await ExhibitionStorage.getById(id);
        if (!exhibition) {
          showError('Error', 'Exposición no encontrada');
          router.push('/admin/exposiciones');
          return;
        }

        setFormData(exhibition);

        // Get categories
        const storedCategories = await ExhibitionCategoryStorage.getAll();
        setCategories(storedCategories);
      } catch (error) {
        console.error('Error initializing data:', error);
        showError('Error', 'Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      initializeData();
    }
  }, [id, router]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    if (!isEnglish) {
      setFormData({
        ...formData,
        title,
        slug: generateSlug(title)
      });
    } else {
      setFormData({
        ...formData,
        titleEn: title
      });
    }
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

  const handleCategoryToggle = (categoryName: string) => {
    const currentCategories = formData.categories || [];
    if (currentCategories.includes(categoryName)) {
      setFormData({
        ...formData,
        categories: currentCategories.filter(c => c !== categoryName)
      });
    } else {
      setFormData({
        ...formData,
        categories: [...currentCategories, categoryName]
      });
    }
  };

  const handleHeroImageAdd = (url: string) => {
    setFormData({
      ...formData,
      heroImages: [...(formData.heroImages || []), url]
    });
  };

  const handleHeroImageRemove = (index: number) => {
    const newImages = [...(formData.heroImages || [])];
    newImages.splice(index, 1);
    setFormData({
      ...formData,
      heroImages: newImages
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content) {
      showError('Error de Validación', 'Por favor completa al menos el título y contenido');
      return;
    }

    if (!formData.categories || formData.categories.length === 0) {
      showError('Error de Validación', 'Debes seleccionar al menos una categoría');
      return;
    }

    try {
      const updatedExhibition = await ExhibitionStorage.update(id, formData);

      if (updatedExhibition) {
        // Update category counts after updating exhibition
        await ExhibitionCategoryStorage.updateCounts();

        showSuccess('Éxito', 'Exposición actualizada correctamente');
        setTimeout(() => {
          router.push('/admin/exposiciones');
        }, 2000);
      } else {
        showError('Error', 'No se pudo actualizar la exposición');
      }
    } catch (error) {
      console.error('Error updating exhibition:', error);
      showError('Error', 'Error al actualizar la exposición');
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
    <div className="p-8 max-w-5xl mx-auto">
      <ToastNotification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/exposiciones" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Volver a exposiciones
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Editar Exposición</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Language Toggle */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Idioma</h2>
            <button
              type="button"
              onClick={() => setIsEnglish(!isEnglish)}
              className={`px-4 py-2 rounded-lg font-medium ${
                isEnglish
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isEnglish ? 'English' : 'Español'}
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Información Básica</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título {isEnglish && '(English)'}
              </label>
              <input
                type="text"
                value={isEnglish ? (formData.titleEn || '') : (formData.title || '')}
                onChange={handleTitleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={isEnglish ? "Exhibition title in English" : "Título de la exposición"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL)
              </label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="url-de-la-exposicion"
                disabled={isEnglish}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lugar {isEnglish && '(English)'}
              </label>
              <input
                type="text"
                value={isEnglish ? (formData.venueEn || '') : (formData.venue || '')}
                onChange={(e) => setFormData({
                  ...formData,
                  [isEnglish ? 'venueEn' : 'venue']: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={isEnglish ? "Exhibition venue" : "Lugar de la exposición"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curador {isEnglish && '(English)'}
              </label>
              <input
                type="text"
                value={isEnglish ? (formData.curatorEn || '') : (formData.curator || '')}
                onChange={(e) => setFormData({
                  ...formData,
                  [isEnglish ? 'curatorEn' : 'curator']: e.target.value
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={isEnglish ? "Curator name" : "Nombre del curador"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  startDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de fin
              </label>
              <input
                type="date"
                value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  endDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enlace externo
              </label>
              <input
                type="url"
                value={formData.externalLink || ''}
                onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://ejemplo.com/exposicion"
              />
              <p className="text-xs text-gray-500 mt-1">URL del sitio web de la exposición (opcional)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status || 'draft'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' | 'archived' })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Categorías</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={formData.categories?.includes(category.name) || false}
                  onChange={() => handleCategoryToggle(category.name)}
                  className="mr-2"
                />
                <span className={`px-3 py-1 rounded-full text-sm ${
                  formData.categories?.includes(category.name)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Main Image */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Imagen Principal</h2>
          <ImageUploader
            onImageUpload={(url) => setFormData({ ...formData, image: url })}
            currentImage={formData.image}
            folder={`exposiciones/${id}`}
          />
        </div>

        {/* Hero Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Imágenes del Slider</h2>
          <div className="space-y-4">
            {formData.heroImages?.map((image, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <img src={image} alt={`Hero ${index + 1}`} className="w-24 h-24 object-cover rounded" />
                <span className="flex-1 text-sm truncate">{image}</span>
                <button
                  type="button"
                  onClick={() => handleHeroImageRemove(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Eliminar
                </button>
              </div>
            ))}
            <ImageUploader
              onImageUpload={handleHeroImageAdd}
              folder={`exposiciones/${id}/hero`}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Contenido {isEnglish && '(English)'}
          </h2>
          <RichTextEditor
            value={isEnglish ? (formData.contentEn || '') : (formData.content || '')}
            onChange={(content) => setFormData({
              ...formData,
              [isEnglish ? 'contentEn' : 'content']: content
            })}
            placeholder={isEnglish ? "Exhibition content in English..." : "Contenido de la exposición..."}
          />
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Etiquetas</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
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
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Agregar etiqueta..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Agregar
            </button>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/exposiciones"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}