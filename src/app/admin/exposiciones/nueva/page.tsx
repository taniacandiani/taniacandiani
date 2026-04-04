'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Exhibition, ExhibitionCategory } from '@/types';
import { ExhibitionStorage } from '@/lib/exhibitionStorage';
import { ExhibitionCategoryStorage } from '@/lib/exhibitionCategoryStorage';
import { generateSlug } from '@/lib/utils';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function NewExhibitionPage() {
  const router = useRouter();
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
    categories: [],
    status: 'published',
    tags: [],
    heroImages: [],
    heroImageContain: false,
    externalLink: '',
    publishedAt: new Date().toISOString()
  });

  const [tagInput, setTagInput] = useState('');
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);

        // Get categories
        const storedCategories = await ExhibitionCategoryStorage.getAll();
        setCategories(storedCategories);

        // Set default category if we don't have "Activas"
        if (!formData.categories?.includes('Activas')) {
          const activasCategory = storedCategories.find(c => c.name === 'Activas');
          if (activasCategory) {
            setFormData(prev => ({
              ...prev,
              categories: ['Activas']
            }));
          }
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
      const finalSlug = formData.slug && formData.slug.trim() !== ''
        ? formData.slug.trim()
        : generateSlug(formData.title!);

      const exhibitionData: Omit<Exhibition, 'id'> = {
        title: formData.title!,
        titleEn: formData.titleEn,
        content: formData.content!,
        contentEn: formData.contentEn,
        image: formData.image || '',
        slug: finalSlug,
        venue: formData.venue,
        venueEn: formData.venueEn,
        startDate: formData.startDate,
        endDate: formData.endDate,
        publishedAt: formData.publishedAt || new Date().toISOString(),
        categories: formData.categories,
        status: formData.status as 'published' | 'draft' | 'archived',
        tags: formData.tags || [],
        heroImages: formData.heroImages || [],
        heroImageContain: formData.heroImageContain ?? false,
        externalLink: formData.externalLink || undefined,
        createdAt: formData.createdAt
      };

      const savedExhibition = await ExhibitionStorage.create(exhibitionData);

      if (savedExhibition) {
        // Update category counts after creating exhibition
        await ExhibitionCategoryStorage.updateCounts();

        showSuccess('Éxito', 'Exposición creada correctamente');
        setTimeout(() => {
          router.push('/admin/exposiciones');
        }, 2000);
      } else {
        showError('Error', 'No se pudo crear la exposición');
      }
    } catch (error) {
      console.error('Error creating exhibition:', error);
      showError('Error', 'Error al crear la exposición');
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
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nueva Exposición</h1>
          <p className="text-gray-600">Crea una nueva exposición para el sitio web</p>
        </div>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex justify-between items-center mb-8 pt-4 border-b border-gray-200 pb-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsEnglish(!isEnglish)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {isEnglish ? 'English' : 'Español'}
          </button>
        </div>

        <div className="flex gap-4">
          <Link
            href="/admin/exposiciones"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            form="exhibition-form"
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Crear Exposición
          </button>
        </div>
      </div>

      <form id="exhibition-form" onSubmit={handleSubmit} className="space-y-8">
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
                value={isEnglish ? formData.titleEn : formData.title}
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
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="url-de-la-exposicion"
                disabled={isEnglish}
              />
            </div>

            {!isEnglish && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Creación
                </label>
                <input
                  type="datetime-local"
                  value={formData.createdAt ? formData.createdAt.slice(0, 16) : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      // Agregar segundos y Z para UTC sin conversión de zona horaria
                      setFormData({ ...formData, createdAt: e.target.value + ':00Z' });
                    } else {
                      setFormData({ ...formData, createdAt: undefined });
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controla el orden de visualización. Deja en blanco para usar la fecha actual.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lugar {isEnglish && '(English)'}
              </label>
              <input
                type="text"
                value={isEnglish ? formData.venueEn : formData.venue}
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
                Fecha de inicio
              </label>
              <input
                type="date"
                value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                onChange={(e) => setFormData({
                  ...formData,
                  startDate: e.target.value ? e.target.value + 'T12:00:00.000Z' : ''
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
                  endDate: e.target.value ? e.target.value + 'T12:00:00.000Z' : ''
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
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
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
          <p className="text-sm text-gray-600 mb-4">
            La categoría "Activas" se asigna automáticamente según las fechas de inicio/fin
          </p>
          <div className="flex flex-wrap gap-3">
            {categories.filter(cat => cat.name !== 'Activas').map((category) => (
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
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 Si la exposición tiene fecha de inicio y no ha terminado, se agregará automáticamente a "Activas" al guardar
            </p>
          </div>
        </div>

        {/* Main Image */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Imagen Principal</h2>
          <ImageUploader
            onImageUpload={(url) => setFormData({ ...formData, image: url })}
            currentImage={formData.image}
            folder="exposiciones"
          />
          {/* Opciones de visualización de imagen */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="heroImageDisplayMode"
                checked={!formData.heroImageContain}
                onChange={() => setFormData({ ...formData, heroImageContain: false })}
                className="text-black focus:ring-black"
              />
              <span className="text-sm font-medium text-gray-700">Ajustado al ancho</span>
              <span className="text-xs text-gray-500 font-normal">(Por defecto)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="heroImageDisplayMode"
                checked={formData.heroImageContain === true}
                onChange={() => setFormData({ ...formData, heroImageContain: true })}
                className="text-black focus:ring-black"
              />
              <span className="text-sm font-medium text-gray-700">Ajustado solo a altura</span>
            </label>
          </div>
        </div>

        {/* Hero Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Imágenes del Slider</h2>
          <div className="space-y-4">
            {formData.heroImages?.map((image, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <img src={image} alt={`Hero ${index + 1}`} className="w-24 h-24 object-cover rounded" />
                <span className="flex-1">{image}</span>
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
              folder="exposiciones/hero"
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">
            Contenido {isEnglish && '(English)'}
          </h2>
          <RichTextEditor
            value={isEnglish ? formData.contentEn || '' : formData.content || ''}
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

        {/* Action Buttons - Bottom */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <Link
            href="/admin/exposiciones"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Crear Exposición
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