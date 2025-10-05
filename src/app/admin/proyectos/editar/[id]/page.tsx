'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, ProjectCategory } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { CategoryStorage } from '@/lib/categoryStorage';
import { PROJECT_CATEGORIES } from '@/data/content';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import MediaSelector from '@/components/ui/MediaSelector';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [mediaSelectorType, setMediaSelectorType] = useState<'hero' | 'secondary' | null>(null);
  const [mediaSelectorIndex, setMediaSelectorIndex] = useState<number>(0);
  const [editingLanguage, setEditingLanguage] = useState<'es' | 'en'>('es');
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Migrar proyectos existentes a múltiples categorías
        await ProjectStorage.migrateToMultipleCategories();
        
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

        // Load project
        const id = await params.id as string;
        if (id) {
          const foundProject = await ProjectStorage.getById(id);
          if (foundProject) {
            setProject(foundProject);
          } else {
            router.push('/admin/proyectos');
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        // Fallback to static content
        setCategories(PROJECT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [params.id, router]);

  // Ensure project always has at least one hero image slot
  useEffect(() => {
    if (project && (!project.heroImages || project.heroImages.length === 0)) {
      setProject({ ...project, heroImages: [''] });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    // Validar que haya al menos una categoría seleccionada
    if (!project.categories || project.categories.length === 0) {
      showError('Error de Validación', 'Debes seleccionar al menos una categoría');
      return;
    }

    // Validar que haya al menos una imagen del hero
    const cleanHeroImages = getCleanHeroImages();
    if (!cleanHeroImages || cleanHeroImages.length === 0 || cleanHeroImages[0] === '') {
      showError('Error de Validación', 'Debes agregar al menos una imagen del hero');
      return;
    }

    setSaving(true);
    try {
      // Asegurar que todos los campos requeridos estén presentes
      const updatedProject: Project = {
        ...project,
        id: project.id || '',
        title: project.title || '',
        slug: ProjectStorage.generateSlug(project.title),
        year: project.year || new Date().getFullYear(),
        status: project.status || 'draft',
        categories: project.categories || [],
        heroImages: cleanHeroImages,
        image: project.image || '',
        // Campos opcionales con valores por defecto
        description: project.description || '',
        tags: project.tags || [],
        featured: project.featured || false,
        showInHomeHero: project.showInHomeHero || false,
        projectDetails: project.projectDetails || '',
        technicalSheet: project.technicalSheet || '',
        downloadLink: project.downloadLink || '',
        additionalImage: project.additionalImage || '',
        heroDescription: project.heroDescription || '',
        commissionedBy: project.commissionedBy || '',
        curator: project.curator || '',
        location: project.location || ''
      };

      console.log('Proyecto a actualizar:', updatedProject);

      await ProjectStorage.update(updatedProject);
      
      // Dispatch event to notify other components about the update
      window.dispatchEvent(new CustomEvent('projectsUpdated'));
      
      // Mostrar mensaje de éxito en lugar de redirigir
      showSuccess('Proyecto Guardado', 'El proyecto se ha guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      showError('Error al Guardar', 'Ha ocurrido un error al guardar el proyecto');
    } finally {
      setSaving(false);
    }
  };

  const handleHeroImageChange = (index: number, value: string) => {
    if (!project) return;
    const newHeroImages = [...(project.heroImages || [''])];
    newHeroImages[index] = value;
    setProject({ ...project, heroImages: newHeroImages });
  };

  const openMediaSelector = (type: 'hero' | 'secondary', index: number = 0) => {
    setMediaSelectorType(type);
    setMediaSelectorIndex(index);
    setShowMediaSelector(true);
  };

  const handleMediaSelection = (imageUrl: string) => {
    if (!project || !mediaSelectorType) return;
    
    if (mediaSelectorType === 'hero') {
      const newHeroImages = [...(project.heroImages || [''])];
      newHeroImages[mediaSelectorIndex] = imageUrl;
      setProject({ ...project, heroImages: newHeroImages });
    } else if (mediaSelectorType === 'secondary') {
      setProject({ ...project, image: imageUrl });
    }
  };

  const addHeroImage = () => {
    if (!project) return;
    
    // Only add if the last image has content
    const currentHeroImages = project.heroImages || [''];
    const lastImage = currentHeroImages[currentHeroImages.length - 1];
    
    if (lastImage && lastImage.trim() !== '') {
      setProject({ 
        ...project, 
        heroImages: [...currentHeroImages, ''] 
      });
    }
  };

  // Filter out empty hero images when saving, but always keep at least one slot
  const getCleanHeroImages = () => {
    if (!project?.heroImages) return [''];
    const validImages = project.heroImages.filter(img => img && img.trim() !== '');
    // Always return at least one slot (empty if no valid images)
    return validImages.length > 0 ? validImages : [''];
  };

  // Ensure project always has at least one hero image slot
  const ensureHeroImageSlot = () => {
    if (!project) return;
    if (!project.heroImages || project.heroImages.length === 0) {
      setProject({ ...project, heroImages: [''] });
    }
  };

  const removeHeroImage = (index: number) => {
    if (!project) return;
    
    // Never remove the last image - always keep at least one
    if ((project.heroImages || []).length <= 1) {
      return;
    }
    
    const newHeroImages = (project.heroImages || []).filter((_, i) => i !== index);
    setProject({ ...project, heroImages: newHeroImages });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando proyecto...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Proyecto no encontrado</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar Proyecto</h1>
          <p className="text-gray-600">Edita los detalles del proyecto "{project.title}"</p>
        </div>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex justify-between items-center mb-8 pt-4 border-b border-gray-200 pb-4">
        <div className="flex gap-3">
          <Link
            href={`/proyectos/${project.slug}`}
            target="_blank"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ver Proyecto
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
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Información Básica */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                value={editingLanguage === 'es' ? project.title : (project.title_en || '')}
                onChange={(e) => setProject({
                  ...project,
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
                value={editingLanguage === 'es' ? (project.subtitle || '') : (project.subtitle_en || '')}
                onChange={(e) => setProject({
                  ...project,
                  [editingLanguage === 'es' ? 'subtitle' : 'subtitle_en']: e.target.value
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías *
              </label>
              <div className="space-y-2">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={project.categories?.includes(cat.name) || false}
                      onChange={(e) => {
                        const currentCategories = project.categories || [];
                        if (e.target.checked) {
                          setProject({ 
                            ...project, 
                            categories: [...currentCategories, cat.name]
                          });
                        } else {
                          setProject({ 
                            ...project, 
                            categories: currentCategories.filter(c => c !== cat.name)
                          });
                        }
                      }}
                      className="rounded focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </label>
                ))}
              </div>
              {(!project.categories || project.categories.length === 0) && (
                <p className="text-sm text-red-500 mt-1">Debes seleccionar al menos una categoría</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año *
              </label>
              <input
                type="number"
                value={project.year}
                onChange={(e) => setProject({ ...project, year: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>


        </div>

        {/* Imágenes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imágenes</h2>
          
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Imagen del Hero * <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Botón para agregar imágenes del hero desde Media */}
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => openMediaSelector('hero', 0)}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400"
                      >
                        <div className="text-gray-400 mb-4">
                          <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium">Seleccionar imagen del Hero</p>
                          <p className="text-xs text-gray-500 mt-1">Haz clic para elegir una imagen del Media</p>
                        </div>
                      </button>
                      
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={addHeroImage}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          + Agregar otra imagen del Hero
                        </button>
                      </div>
                    </div>
                    
                    {/* Mostrar miniaturas de las imágenes cargadas */}
                    {project.heroImages && project.heroImages.filter(img => img && img.trim() !== '').length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-3">
                          {project.heroImages.filter(img => img && img.trim() !== '').map((image, index) => (
                            <div key={index} className="relative inline-block">
                              <img
                                src={image}
                                alt={`Imagen del hero ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border"
                              />
                              <div className="absolute -top-2 -right-2 flex space-x-1">
                                <button
                                  type="button"
                                  onClick={() => openMediaSelector('hero', index)}
                                  className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-blue-600"
                                  title="Cambiar imagen"
                                >
                                  ↻
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentHeroImages = project.heroImages || [''];
                                    const newHeroImages = [...currentHeroImages];
                                    newHeroImages[index] = '';
                                    setProject({ ...project, heroImages: newHeroImages });
                                  }}
                                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                  title="Eliminar imagen"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const currentHeroImages = project.heroImages || [''];
                              const lastIndex = currentHeroImages.filter(img => img && img.trim() !== '').length;
                              openMediaSelector('hero', lastIndex);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                          >
                            + Agregar imagen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen Secundaria
                  </label>
                  
                  {project.image ? (
                    <div className="space-y-3">
                      <img
                        src={project.image}
                        alt="Imagen secundaria"
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => openMediaSelector('secondary')}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Cambiar Imagen
                        </button>
                        <button
                          type="button"
                          onClick={() => setProject({ ...project, image: '' })}
                          className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openMediaSelector('secondary')}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400"
                    >
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Seleccionar imagen del Media</p>
                        <p className="text-xs text-gray-500 mt-1">Haz clic para elegir una imagen existente</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>

          
        </div>

        {/* Contenido */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                value={editingLanguage === 'es' ? (project.projectDetails || '') : (project.projectDetails_en || '')}
                onChange={(content) => setProject({
                  ...project,
                  [editingLanguage === 'es' ? 'projectDetails' : 'projectDetails_en']: content
                })}
                placeholder={editingLanguage === 'es' ? 'Escribe los detalles del proyecto aquí...' : 'Write the project details here...'}
                height={250}
              />
            </div>

            <div>
              <RichTextEditor
                label={editingLanguage === 'es' ? 'Ficha Técnica' : 'Technical Sheet'}
                value={editingLanguage === 'es' ? (project.technicalSheet || '') : (project.technicalSheet_en || '')}
                onChange={(content) => setProject({
                  ...project,
                  [editingLanguage === 'es' ? 'technicalSheet' : 'technicalSheet_en']: content
                })}
                placeholder={editingLanguage === 'es' ? 'Escribe la ficha técnica aquí...' : 'Write the technical sheet here...'}
                height={250}
              />
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
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
                value={project.downloadLink || ''}
                onChange={(e) => setProject({ ...project, downloadLink: e.target.value })}
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
                value={editingLanguage === 'es' ? (project.commissionedBy || '') : (project.commissionedBy_en || '')}
                onChange={(e) => setProject({
                  ...project,
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
                value={editingLanguage === 'es' ? (project.curator || '') : (project.curator_en || '')}
                onChange={(e) => setProject({
                  ...project,
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
                value={editingLanguage === 'es' ? (project.location || '') : (project.location_en || '')}
                onChange={(e) => setProject({
                  ...project,
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
                  checked={project.showInHomeHero || false}
                  onChange={(e) => setProject({ ...project, showInHomeHero: e.target.checked })}
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

            {project.showInHomeHero && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingLanguage === 'es' ? 'Descripción para el Hero' : 'Hero Description'}
                </label>
                <textarea
                  value={editingLanguage === 'es' ? (project.heroDescription || '') : (project.heroDescription_en || '')}
                  onChange={(e) => setProject({
                    ...project,
                    [editingLanguage === 'es' ? 'heroDescription' : 'heroDescription_en']: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder={editingLanguage === 'es' ? 'Descripción que aparecerá en el hero de la página principal' : 'Description that will appear in the home page hero'}
                />
              </div>
            )}
          </div>
        </div>

        {/* Estado del Proyecto */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado del Proyecto</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={project.status || 'published'}
              onChange={(e) => setProject({ ...project, status: e.target.value as 'published' | 'draft' | 'archived' })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
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
            disabled={saving}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
      
      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelection}
        title={mediaSelectorType === 'hero' ? 'Seleccionar Imagen del Hero' : 'Seleccionar Imagen Secundaria'}
        contentType="proyectos"
      />
      
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
