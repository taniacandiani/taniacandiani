'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, ProjectCategory, ProjectTab } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { CategoryStorage } from '@/lib/categoryStorage';
import { PROJECT_CATEGORIES } from '@/data/content';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import ReorderableImageList from '@/components/ui/ReorderableImageList';
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
  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1); // -1 for main content, 0+ for tabs
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
            // Ensure tabs array exists
            if (!foundProject.tabs) {
              foundProject.tabs = [];
            }
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

  // Notificar al layout cuando cambia el idioma
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('editingLanguageChanged', {
      detail: { language: editingLanguage }
    }));
  }, [editingLanguage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Shift+S para guardar
      // Usar tanto 's' como 'S' para mayor compatibilidad
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        const form = document.getElementById('project-form') as HTMLFormElement;
        if (form && !saving) {
          console.log('Shortcut triggered: Save');
          form.requestSubmit();
        }
      }

      // Cmd/Ctrl+Shift+E para cambiar idioma
      // Usar tanto 'e' como 'E' para mayor compatibilidad
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Shortcut triggered: Change language');
        setEditingLanguage(editingLanguage === 'es' ? 'en' : 'es');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingLanguage, saving]);

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
        heroImageDescriptions: project.heroImageDescriptions || [],
        heroImageDescriptions_en: project.heroImageDescriptions_en || [],
        image: project.image || cleanHeroImages[0] || '',
        // Campos opcionales - mantener undefined si están vacíos
        description: project.description,
        tags: project.tags || [],
        featured: project.featured || false,
        showInHomeHero: project.showInHomeHero || false,
        projectDetails: project.projectDetails,
        technicalSheet: project.technicalSheet,
        downloadLink: project.downloadLink,
        additionalImage: project.additionalImage, // No usar || '' para permitir eliminar
        heroDescription: project.heroDescription,
        commissionedBy: project.commissionedBy,
        curator: project.curator,
        location: project.location,
        // Campos en inglés
        title_en: project.title_en,
        description_en: project.description_en,
        projectDetails_en: project.projectDetails_en,
        technicalSheet_en: project.technicalSheet_en,
        heroDescription_en: project.heroDescription_en,
        commissionedBy_en: project.commissionedBy_en,
        curator_en: project.curator_en,
        location_en: project.location_en,
        // Timestamps - preservar para control de fecha de creación
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
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
      setProject({ ...project, additionalImage: imageUrl });
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

  // Tab management functions
  const addTab = () => {
    if (!project) return;

    const newTab: ProjectTab = {
      id: `tab-${Date.now()}`,
      projectId: project.id,
      tabOrder: (project.tabs?.length || 0),
      title: '',
      heroImages: [''],
      heroImageDescriptions: [''],
      heroImageDescriptions_en: [''],
      additionalImage: '',
      projectDetails: '',
      technicalSheet: '',
      title_en: '',
      projectDetails_en: '',
      technicalSheet_en: ''
    };

    const newTabIndex = project.tabs?.length || 0;

    setProject({
      ...project,
      tabs: [...(project.tabs || []), newTab]
    });

    // Automatically switch to the new tab
    setActiveTabIndex(newTabIndex);
  };

  const removeTab = (index: number) => {
    if (!project) return;

    const newTabs = (project.tabs || []).filter((_, i) => i !== index);
    // Update tabOrder for remaining tabs
    newTabs.forEach((tab, i) => {
      tab.tabOrder = i;
    });
    setProject({ ...project, tabs: newTabs });
  };

  const updateTab = (index: number, field: keyof ProjectTab, value: any) => {
    if (!project) return;

    const newTabs = [...(project.tabs || [])];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setProject({ ...project, tabs: newTabs });
  };

  const removeTabHeroImage = (tabIndex: number, imageIndex: number) => {
    if (!project) return;

    const newTabs = [...(project.tabs || [])];
    const tab = newTabs[tabIndex];

    // Never remove the last image - always keep at least one empty slot
    if ((tab.heroImages || []).length <= 1) {
      return;
    }

    const newHeroImages = (tab.heroImages || []).filter((_, i) => i !== imageIndex);
    const newDescriptions = (tab.heroImageDescriptions || []).filter((_, i) => i !== imageIndex);
    const newDescriptionsEn = (tab.heroImageDescriptions_en || []).filter((_, i) => i !== imageIndex);

    newTabs[tabIndex] = {
      ...tab,
      heroImages: newHeroImages,
      heroImageDescriptions: newDescriptions,
      heroImageDescriptions_en: newDescriptionsEn
    };

    setProject({ ...project, tabs: newTabs });
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
    <div className={`min-h-screen transition-colors duration-300 ${editingLanguage === 'en' ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`${editingLanguage === 'en' ? 'bg-gray-800' : 'bg-white'} pb-4`}>
        <div className="mb-8">
          <div>
            <h1 className={`text-2xl font-bold mb-2 ${editingLanguage === 'en' ? 'text-white' : 'text-gray-900'}`}>Editar Proyecto</h1>
            <p className={`${editingLanguage === 'en' ? 'text-gray-300' : 'text-gray-600'}`}>Edita los detalles del proyecto "{project.title}"</p>
          </div>
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
            title="Atajo: Cmd/Ctrl+Shift+E"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            <span>{editingLanguage === 'es' ? 'English' : 'Español'}</span>
            <span className="ml-2 text-xs text-gray-400">⇧⌘E</span>
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
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            title="Atajo: Cmd/Ctrl+Shift+S"
          >
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            {!saving && <span className="text-xs text-gray-400">⇧⌘S</span>}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {/* Main Content Tab */}
          <button
            type="button"
            onClick={() => setActiveTabIndex(-1)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTabIndex === -1
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contenido Principal
          </button>

          {/* Dynamic Tabs */}
          {project.tabs?.map((tab, index) => (
            <div key={tab.id} className="flex items-center">
              <button
                type="button"
                onClick={() => setActiveTabIndex(index)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTabIndex === index
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.title || `Tab ${index + 1}`}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeTab(index);
                  // Si eliminamos el tab activo, volver al contenido principal
                  if (activeTabIndex === index) {
                    setActiveTabIndex(-1);
                  } else if (activeTabIndex > index) {
                    // Ajustar el índice activo si es mayor al eliminado
                    setActiveTabIndex(activeTabIndex - 1);
                  }
                }}
                className="ml-1 text-red-500 hover:text-red-700 p-1"
                title="Eliminar tab"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add Tab Button */}
          <button
            type="button"
            onClick={addTab}
            className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
        {activeTabIndex === -1 ? (
          <>
            {/* Main Content - Show when no tab is selected */}
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
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required={editingLanguage === 'es'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Año *
              </label>
              <input
                type="number"
                value={project.year}
                onChange={(e) => setProject({ ...project, year: parseInt(e.target.value) })}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Creación
              </label>
              <input
                type="datetime-local"
                value={project.createdAt ? project.createdAt.slice(0, 16) : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    // Agregar segundos y Z para UTC sin conversión de zona horaria
                    setProject({ ...project, createdAt: e.target.value + ':00Z' });
                  } else {
                    setProject({ ...project, createdAt: undefined });
                  }
                }}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controla el orden de visualización. Creado el: {project.createdAt ? new Date(project.createdAt).toLocaleString('es-ES') : 'N/A'}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías * (Selecciona una o más)
              </label>
              <div className="bg-white border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
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
                        className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              {project.categories && project.categories.length > 0 ? (
                <p className="text-xs text-gray-500 mt-1">
                  {project.categories.length} categoría{project.categories.length !== 1 ? 's' : ''} seleccionada{project.categories.length !== 1 ? 's' : ''}
                </p>
              ) : (
                <p className="text-sm text-red-500 mt-1">Debes seleccionar al menos una categoría</p>
              )}
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
                          onClick={() => {
                            const currentHeroImages = project.heroImages || [''];
                            const lastIndex = currentHeroImages.filter(img => img && img.trim() !== '').length;
                            openMediaSelector('hero', lastIndex);
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          + Agregar otra imagen del Hero
                        </button>
                      </div>
                    </div>
                    
                    {/* Mostrar imágenes del hero con drag and drop */}
                    <ReorderableImageList
                      images={project.heroImages || ['']}
                      descriptions={project.heroImageDescriptions}
                      descriptionsEn={project.heroImageDescriptions_en}
                      editingLanguage={editingLanguage}
                      onReorder={(newImages, newDescriptions, newDescriptionsEn) => {
                        // Actualizar también project.image con la primera heroImage
                        const firstImage = newImages.find(img => img && img.trim() !== '') || '';
                        setProject({
                          ...project,
                          heroImages: newImages,
                          image: firstImage, // Sincronizar con la primera imagen
                          heroImageDescriptions: newDescriptions,
                          heroImageDescriptions_en: newDescriptionsEn
                        });
                      }}
                      onRemove={(index) => {
                        const newHeroImages = project.heroImages?.filter((_, i) => i !== index) || [];
                        const newDescriptions = project.heroImageDescriptions?.filter((_, i) => i !== index) || [];
                        const newDescriptionsEn = project.heroImageDescriptions_en?.filter((_, i) => i !== index) || [];
                        // Actualizar project.image con la nueva primera imagen
                        const firstImage = newHeroImages.find(img => img && img.trim() !== '') || '';
                        setProject({
                          ...project,
                          heroImages: newHeroImages.length > 0 ? newHeroImages : [''],
                          image: firstImage, // Sincronizar con la primera imagen
                          heroImageDescriptions: newDescriptions,
                          heroImageDescriptions_en: newDescriptionsEn
                        });
                      }}
                      onDescriptionChange={(index, value, language) => {
                        const field = language === 'es' ? 'heroImageDescriptions' : 'heroImageDescriptions_en';
                        const descriptions = [...(project[field] || [])];
                        while (descriptions.length <= index) {
                          descriptions.push('');
                        }
                        descriptions[index] = value;
                        setProject({ ...project, [field]: descriptions });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen Secundaria
                  </label>

                  {project.additionalImage ? (
                    <div className="space-y-3">
                      <img
                        src={project.additionalImage}
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
                          onClick={() => setProject({ ...project, additionalImage: '' })}
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
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
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
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
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
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
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
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
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
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-black"
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
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
            </div>
          </>
        ) : activeTabIndex >= 0 && project.tabs?.[activeTabIndex] ? (
          /* Tab Content - Show when a tab is selected */
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            {(() => {
              const tab = project.tabs[activeTabIndex];
              const tabIndex = activeTabIndex;
              return (
                <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Tab {tabIndex + 1}: {tab.title || 'Sin título'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">
                      Editando en: {editingLanguage === 'es' ? 'Español' : 'English'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeTab(tabIndex)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Título del Tab */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {editingLanguage === 'es' ? 'Título del Tab *' : 'Tab Title *'}
                    </label>
                    <input
                      type="text"
                      value={editingLanguage === 'es' ? tab.title : (tab.title_en || '')}
                      onChange={(e) => updateTab(
                        tabIndex,
                        editingLanguage === 'es' ? 'title' : 'title_en',
                        e.target.value
                      )}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                      required={editingLanguage === 'es'}
                    />
                  </div>

                  {/* Imágenes del Hero del Tab */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {editingLanguage === 'es' ? 'Imágenes del Hero del Tab' : 'Tab Hero Images'}
                    </label>
                    <ImageUploader
                      label=""
                      projectId={project.slug}
                      currentImage=""
                      onImageUpload={(imageUrl) => {
                        if (imageUrl) {
                          const newTabs = [...(project.tabs || [])];
                          const currentTab = newTabs[tabIndex];
                          const newHeroImages = [...(currentTab.heroImages || [''])];
                          if (newHeroImages.length === 0 || newHeroImages[0] === '') {
                            newHeroImages[0] = imageUrl;
                          } else {
                            newHeroImages.push(imageUrl);
                          }
                          currentTab.heroImages = newHeroImages;
                          setProject({ ...project, tabs: newTabs });
                        }
                      }}
                      required={false}
                      contentType={`proyectos/${project.slug}`}
                      multiple={true}
                      onImagesUpload={(imageUrls) => {
                        if (imageUrls.length > 0) {
                          const newTabs = [...(project.tabs || [])];
                          const currentTab = newTabs[tabIndex];
                          const currentImages = (currentTab.heroImages || []).filter(img => img && img.trim() !== '');
                          const newHeroImages = [...currentImages, ...imageUrls];

                          // Actualizar descripciones
                          const currentDescriptions = currentTab.heroImageDescriptions || [];
                          const currentDescriptionsEn = currentTab.heroImageDescriptions_en || [];
                          const newDescriptions = [...currentDescriptions];
                          const newDescriptionsEn = [...currentDescriptionsEn];

                          while (newDescriptions.length < newHeroImages.length) {
                            newDescriptions.push('');
                          }
                          while (newDescriptionsEn.length < newHeroImages.length) {
                            newDescriptionsEn.push('');
                          }

                          currentTab.heroImages = newHeroImages;
                          currentTab.heroImageDescriptions = newDescriptions;
                          currentTab.heroImageDescriptions_en = newDescriptionsEn;
                          setProject({ ...project, tabs: newTabs });
                        }
                      }}
                    />

                    {/* Mostrar imágenes del hero del tab con reordenamiento */}
                    <ReorderableImageList
                      images={tab.heroImages || ['']}
                      descriptions={tab.heroImageDescriptions}
                      descriptionsEn={tab.heroImageDescriptions_en}
                      editingLanguage={editingLanguage}
                      onReorder={(newImages, newDescriptions, newDescriptionsEn) => {
                        const newTabs = [...(project.tabs || [])];
                        newTabs[tabIndex] = {
                          ...newTabs[tabIndex],
                          heroImages: newImages,
                          heroImageDescriptions: newDescriptions,
                          heroImageDescriptions_en: newDescriptionsEn
                        };
                        setProject({ ...project, tabs: newTabs });
                      }}
                      onRemove={(index) => {
                        const newTabs = [...(project.tabs || [])];
                        const currentTab = newTabs[tabIndex];
                        const newHeroImages = currentTab.heroImages?.filter((_, i) => i !== index) || [];
                        const newDescriptions = currentTab.heroImageDescriptions?.filter((_, i) => i !== index) || [];
                        const newDescriptionsEn = currentTab.heroImageDescriptions_en?.filter((_, i) => i !== index) || [];
                        newTabs[tabIndex] = {
                          ...currentTab,
                          heroImages: newHeroImages.length > 0 ? newHeroImages : [''],
                          heroImageDescriptions: newDescriptions,
                          heroImageDescriptions_en: newDescriptionsEn
                        };
                        setProject({ ...project, tabs: newTabs });
                      }}
                      onDescriptionChange={(index, value, language) => {
                        const newTabs = [...(project.tabs || [])];
                        const currentTab = newTabs[tabIndex];
                        const field = language === 'es' ? 'heroImageDescriptions' : 'heroImageDescriptions_en';
                        const descriptions = [...(currentTab[field] || [])];
                        while (descriptions.length <= index) {
                          descriptions.push('');
                        }
                        descriptions[index] = value;
                        newTabs[tabIndex] = { ...currentTab, [field]: descriptions };
                        setProject({ ...project, tabs: newTabs });
                      }}
                    />
                  </div>

                  {/* Imagen Secundaria del Tab */}
                  <div>
                    <ImageUploader
                      label={editingLanguage === 'es' ? 'Imagen Secundaria del Tab' : 'Tab Secondary Image'}
                      projectId={project.slug}
                      currentImage={tab.additionalImage}
                      onImageUpload={(imageUrl) => updateTab(tabIndex, 'additionalImage', imageUrl)}
                      required={false}
                      contentType={`proyectos/${project.slug}`}
                    />
                  </div>

                  {/* Detalles del Proyecto del Tab */}
                  <div>
                    <RichTextEditor
                      label={editingLanguage === 'es' ? 'Detalles del Proyecto' : 'Project Details'}
                      value={editingLanguage === 'es' ? (tab.projectDetails || '') : (tab.projectDetails_en || '')}
                      onChange={(content) => updateTab(
                        tabIndex,
                        editingLanguage === 'es' ? 'projectDetails' : 'projectDetails_en',
                        content
                      )}
                      placeholder={editingLanguage === 'es'
                        ? 'Escribe los detalles del proyecto para este tab...'
                        : 'Write the project details for this tab...'}
                      height={200}
                    />
                  </div>

                  {/* Ficha Técnica del Tab */}
                  <div>
                    <RichTextEditor
                      label={editingLanguage === 'es' ? 'Ficha Técnica' : 'Technical Sheet'}
                      value={editingLanguage === 'es' ? (tab.technicalSheet || '') : (tab.technicalSheet_en || '')}
                      onChange={(content) => updateTab(
                        tabIndex,
                        editingLanguage === 'es' ? 'technicalSheet' : 'technicalSheet_en',
                        content
                      )}
                      placeholder={editingLanguage === 'es'
                        ? 'Escribe la ficha técnica para este tab...'
                        : 'Write the technical sheet for this tab...'}
                      height={200}
                    />
                  </div>
                </div>
                </>
              );
            })()}
          </div>
        ) : null}

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
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            title="Atajo: Cmd/Ctrl+Shift+S"
          >
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            {!saving && <span className="text-xs text-gray-400">⇧⌘S</span>}
          </button>
        </div>
      </form>
      
      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelection}
        title={mediaSelectorType === 'hero' ? 'Seleccionar Imagen del Hero' : 'Seleccionar Imagen Secundaria'}
        contentType={`proyectos/${project.slug}`}
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
