'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, ProjectCategory } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { CategoryStorage } from '@/lib/categoryStorage';
import { PROJECT_CATEGORIES } from '@/data/content';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function NewProjectPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [editingLanguage, setEditingLanguage] = useState<'es' | 'en'>('es');
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    subtitle: '',
    category: '',
    year: new Date().getFullYear(),
    image: '',
    heroImages: [''],
    projectDetails: '',
    technicalSheet: '',
    downloadLink: '',
    additionalImage: '',
    showInHomeHero: false,
    heroDescription: '',
    commissionedBy: '',
    curator: '',
    location: '',
    tags: [],
    // English fields
    title_en: '',
    subtitle_en: '',
    projectDetails_en: '',
    technicalSheet_en: '',
    heroDescription_en: '',
    commissionedBy_en: '',
    curator_en: '',
    location_en: '',
  });
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeCategories = async () => {
      try {
        // Initialize categories
        const storedCategories = await CategoryStorage.getAll();
        if (storedCategories.length === 0) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default categories from content.ts');
          setCategories(PROJECT_CATEGORIES);
        } else {
          setCategories(storedCategories);
        }

        // Set default category if we don't have one
        if (!formData.category && storedCategories.length > 0) {
          setFormData(prev => ({ ...prev, category: storedCategories[0].name }));
        }
      } catch (error) {
        console.error('Error initializing categories:', error);
        // Fallback to static content
        setCategories(PROJECT_CATEGORIES);
      }
    };

    initializeCategories();
  }, [formData.category]);

  // Ensure form always has at least one hero image slot
  useEffect(() => {
    if (!formData.heroImages || formData.heroImages.length === 0) {
      setFormData(prev => ({ ...prev, heroImages: [''] }));
    }
  }, [formData.heroImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      showError('Error de Validación', 'Por favor completa al menos el título');
      return;
    }
    
    const cleanHeroImages = getCleanHeroImages();
    
    // Validar que haya al menos una imagen del hero
    if (!cleanHeroImages || cleanHeroImages.length === 0 || cleanHeroImages[0] === '') {
      showError('Error de Validación', 'Debes agregar al menos una imagen del hero');
      return;
    }
    
    const newProject: Project = {
      ...formData as Project,
      id: ProjectStorage.generateId(),
      slug: ProjectStorage.generateSlug(formData.title!),
      status: 'published',
      heroImages: cleanHeroImages,
      // Mantener la imagen secundaria separada del hero
      image: formData.image || ''
    };

    try {
      await ProjectStorage.save(newProject);
      
      // Dispatch event to notify other components about the update
      window.dispatchEvent(new CustomEvent('projectsUpdated'));
      
      // Mostrar mensaje de éxito y limpiar el formulario
      showSuccess('Proyecto Creado', 'El proyecto se ha creado exitosamente');
      
      // Limpiar el formulario para crear otro proyecto
      setFormData({
        title: '',
        subtitle: '',
        category: '',
        year: new Date().getFullYear(),
        image: '',
        heroImages: [''],
        projectDetails: '',
        technicalSheet: '',
        downloadLink: '',
        additionalImage: '',
        showInHomeHero: false,
        heroDescription: '',
        commissionedBy: '',
        curator: '',
        location: '',
        tags: [],
      });
    } catch (error) {
      console.error('Error saving project:', error);
      showError('Error al Guardar', 'Ha ocurrido un error al guardar el proyecto');
    }
  };

  const handleHeroImageChange = (index: number, value: string) => {
    const newHeroImages = [...(formData.heroImages || [''])];
    newHeroImages[index] = value;
    setFormData({ ...formData, heroImages: newHeroImages });
  };

  const addHeroImage = () => {
    // Only add if the last image has content
    const currentHeroImages = formData.heroImages || [''];
    const lastImage = currentHeroImages[currentHeroImages.length - 1];
    
    if (lastImage && lastImage.trim() !== '') {
      setFormData({ 
        ...formData, 
        heroImages: [...currentHeroImages, ''] 
      });
    }
  };

  // Filter out empty hero images when saving, but always keep at least one slot
  const getCleanHeroImages = () => {
    if (!formData?.heroImages) return [''];
    const validImages = formData.heroImages.filter(img => img && img.trim() !== '');
    // Always return at least one slot (empty if no valid images)
    return validImages.length > 0 ? validImages : [''];
  };

  const removeHeroImage = (index: number) => {
    // Never remove the last image - always keep at least one
    if ((formData.heroImages || []).length <= 1) {
      return;
    }
    
    const newHeroImages = (formData.heroImages || []).filter((_, i) => i !== index);
    setFormData({ ...formData, heroImages: newHeroImages });
  };

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nuevo Proyecto</h1>
          <p className="text-gray-600">Crea un nuevo proyecto artístico</p>
        </div>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex justify-between items-center mb-8 pt-4 border-b border-gray-200 pb-4">
        <div className="flex gap-3">
          <Link
            href="/admin/proyectos"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Ver Proyectos
          </Link>

          <button
            type="button"
            onClick={() => setEditingLanguage(editingLanguage === 'es' ? 'en' : 'es')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            {editingLanguage === 'es' ? 'English' : 'Español'}
          </button>
        </div>

        <div className="flex gap-4">
          <Link
            href="/admin/proyectos"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            form="project-form"
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Crear Proyecto
          </button>
        </div>
      </div>

      <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>
            <span className="text-sm font-medium text-gray-600">
              Editando en: {editingLanguage === 'es' ? 'Español' : 'English'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingLanguage === 'es' ? 'Título *' : 'Title *'}
              </label>
              <input
                type="text"
                value={editingLanguage === 'es' ? formData.title : (formData.title_en || '')}
                onChange={(e) => setFormData({
                  ...formData,
                  [editingLanguage === 'es' ? 'title' : 'title_en']: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required={editingLanguage === 'es'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingLanguage === 'es' ? 'Subtítulo' : 'Subtitle'}
              </label>
              <input
                type="text"
                value={editingLanguage === 'es' ? (formData.subtitle || '') : (formData.subtitle_en || '')}
                onChange={(e) => setFormData({
                  ...formData,
                  [editingLanguage === 'es' ? 'subtitle' : 'subtitle_en']: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
                              <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  required
                >
                  {categories.length === 0 ? (
                    <option value="">Cargando categorías...</option>
                  ) : (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))
                  )}
                </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>


        </div>

        {/* Imágenes */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imágenes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Imagen del Hero <span className="text-red-500">*</span>
              </label>

              {/* Usar ImageUploader para las imágenes del hero */}
              <ImageUploader
                  label=""
                  projectId="new"
                  currentImage=""
                  onImageUpload={(imageUrl) => {
                    if (imageUrl) {
                      const newHeroImages = [...(formData.heroImages || [''])];
                      if (newHeroImages.length === 0 || newHeroImages[0] === '') {
                        newHeroImages[0] = imageUrl;
                      } else {
                        newHeroImages.push(imageUrl);
                      }
                      setFormData({ ...formData, heroImages: newHeroImages });
                    }
                  }}
                  required={true}
                  contentType="proyectos"
                  multiple={true}
                  onImagesUpload={(imageUrls) => {
                    if (imageUrls.length > 0) {
                      // Obtener las imágenes actuales que no están vacías
                      const currentImages = (formData.heroImages || []).filter(img => img && img.trim() !== '');
                      // Agregar las nuevas imágenes
                      const newHeroImages = [...currentImages, ...imageUrls];
                      setFormData({ ...formData, heroImages: newHeroImages });
                    }
                  }}
                />

              {/* Mostrar miniaturas de las imágenes cargadas */}
              {formData.heroImages && formData.heroImages.filter(img => img && img.trim() !== '').length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 font-medium mb-3">Imágenes del Hero cargadas:</p>
                  <div className="flex flex-wrap gap-3">
                    {formData.heroImages.filter(img => img && img.trim() !== '').map((image, index) => (
                      <div key={index} className="relative inline-block">
                        <img
                          src={image}
                          alt={`Imagen del hero ${index + 1}`}
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newHeroImages = [...(formData.heroImages || [])];
                            newHeroImages.splice(index, 1);
                            setFormData({ ...formData, heroImages: newHeroImages.length > 0 ? newHeroImages : [''] });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <ImageUploader
                label="Imagen Secundaria"
                projectId="new"
                currentImage={formData.image}
                onImageUpload={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
                required={false}
                contentType="proyectos"
              />
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Contenido del Proyecto</h2>
            <span className="text-sm font-medium text-gray-600">
              Editando en: {editingLanguage === 'es' ? 'Español' : 'English'}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <RichTextEditor
                label={editingLanguage === 'es' ? 'Detalles del Proyecto' : 'Project Details'}
                value={editingLanguage === 'es' ? (formData.projectDetails || '') : (formData.projectDetails_en || '')}
                onChange={(content) => setFormData({
                  ...formData,
                  [editingLanguage === 'es' ? 'projectDetails' : 'projectDetails_en']: content
                })}
                placeholder={editingLanguage === 'es' ? 'Escribe los detalles del proyecto aquí...' : 'Write the project details here...'}
                height={250}
              />
            </div>

            <div>
              <RichTextEditor
                label={editingLanguage === 'es' ? 'Ficha Técnica' : 'Technical Sheet'}
                value={editingLanguage === 'es' ? (formData.technicalSheet || '') : (formData.technicalSheet_en || '')}
                onChange={(content) => setFormData({
                  ...formData,
                  [editingLanguage === 'es' ? 'technicalSheet' : 'technicalSheet_en']: content
                })}
                placeholder={editingLanguage === 'es' ? 'Escribe la ficha técnica aquí...' : 'Write the technical sheet here...'}
                height={250}
              />
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Información Adicional</h2>
            <span className="text-sm font-medium text-gray-600">
              Editando en: {editingLanguage === 'es' ? 'Español' : 'English'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingLanguage === 'es' ? 'Link de Descarga' : 'Download Link'}
              </label>
              <input
                type="text"
                value={formData.downloadLink || ''}
                onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://..."
                disabled={editingLanguage === 'en'}
              />
              {editingLanguage === 'en' && (
                <p className="text-xs text-gray-500 mt-1">Este campo es compartido entre idiomas</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingLanguage === 'es' ? 'Comisionado por' : 'Commissioned by'}
              </label>
              <input
                type="text"
                value={editingLanguage === 'es' ? (formData.commissionedBy || '') : (formData.commissionedBy_en || '')}
                onChange={(e) => setFormData({
                  ...formData,
                  [editingLanguage === 'es' ? 'commissionedBy' : 'commissionedBy_en']: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingLanguage === 'es' ? 'Curador/a' : 'Curator'}
              </label>
              <input
                type="text"
                value={editingLanguage === 'es' ? (formData.curator || '') : (formData.curator_en || '')}
                onChange={(e) => setFormData({
                  ...formData,
                  [editingLanguage === 'es' ? 'curator' : 'curator_en']: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingLanguage === 'es' ? 'Ubicación' : 'Location'}
              </label>
              <input
                type="text"
                value={editingLanguage === 'es' ? (formData.location || '') : (formData.location_en || '')}
                onChange={(e) => setFormData({
                  ...formData,
                  [editingLanguage === 'es' ? 'location' : 'location_en']: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.showInHomeHero || false}
                  onChange={(e) => setFormData({ ...formData, showInHomeHero: e.target.checked })}
                  className="rounded focus:ring-black"
                  disabled={editingLanguage === 'en'}
                />
                <span className="text-sm font-medium text-gray-700">
                  {editingLanguage === 'es' ? 'Mostrar en el hero de la página principal' : 'Show in home page hero'}
                </span>
              </label>
              {editingLanguage === 'en' && (
                <p className="text-xs text-gray-500 mt-1">Esta opción se configura solo en español</p>
              )}
            </div>

            {formData.showInHomeHero && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingLanguage === 'es' ? 'Descripción para el Hero' : 'Hero Description'}
                </label>
                <textarea
                  value={editingLanguage === 'es' ? (formData.heroDescription || '') : (formData.heroDescription_en || '')}
                  onChange={(e) => setFormData({
                    ...formData,
                    [editingLanguage === 'es' ? 'heroDescription' : 'heroDescription_en']: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder={editingLanguage === 'es' ? 'Descripción que aparecerá en el hero de la página principal' : 'Description that will appear in the home page hero'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Botones - Bottom */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Link
            href="/admin/proyectos"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Crear Proyecto
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
