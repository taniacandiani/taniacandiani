'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, ProjectCategory, ProjectTab } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { CategoryStorage } from '@/lib/categoryStorage';
import { PROJECT_CATEGORIES } from '@/data/content';
import RichTextEditor from '@/components/ui/RichTextEditor';
import ImageUploader from '@/components/ui/ImageUploader';
import ReorderableImageList from '@/components/ui/ReorderableImageList';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function NewProjectPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [editingLanguage, setEditingLanguage] = useState<'es' | 'en'>('es');

  // Generate folder based on project title (slug)
  const getProjectFolder = () => {
    if (!formData.title || formData.title.trim() === '') {
      return null; // No folder if no title
    }

    const slug = formData.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');

    return `proyectos/${slug}`;
  };

  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    categories: [],
    year: new Date().getFullYear(),
    image: '',
    heroImages: [''],
    heroImageDescriptions: [''],
    heroImageDescriptions_en: [''],
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
    tabs: [],
    // PDF fields
    pdfUrl: '',
    pdfButtonText: '',
    pdfButtonText_en: '',
    // Video field
    videoUrl: '',
    // English fields
    title_en: '',
    projectDetails_en: '',
    technicalSheet_en: '',
    heroDescription_en: '',
    commissionedBy_en: '',
    curator_en: '',
    location_en: '',
  });

  const [activeTabIndex, setActiveTabIndex] = useState<number>(-1); // -1 for main content, 0+ for tabs
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
      } catch (error) {
        console.error('Error initializing categories:', error);
        // Fallback to static content
        setCategories(PROJECT_CATEGORIES);
      }
    };

    initializeCategories();
  }, []);

  // Notificar al layout cuando cambia el idioma
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('editingLanguageChanged', {
      detail: { language: editingLanguage }
    }));
  }, [editingLanguage]);

  // Keyboard shortcuts - usar capture phase para tener prioridad sobre TipTap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Shift+S para guardar
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const form = document.getElementById('project-form') as HTMLFormElement;
        if (form) {
          console.log('Shortcut triggered: Save');
          form.requestSubmit();
        }
        return false;
      }

      // Shift+Cmd+E (Mac) o Ctrl+Shift+E (Windows) para cambiar idioma
      // E de "English/Español"
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('Shortcut triggered: Change language');
        setEditingLanguage(editingLanguage === 'es' ? 'en' : 'es');
        // Forzar que el editor pierda el foco para que el cambio de idioma se aplique
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        return false;
      }
    };

    // Usar capture phase (true) para capturar el evento ANTES que TipTap
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [editingLanguage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que haya al menos una categoría seleccionada
    if (!formData.categories || formData.categories.length === 0) {
      showError('Error de Validación', 'Debes seleccionar al menos una categoría');
      return;
    }

    // Validar que haya al menos una imagen del hero
    const cleanHeroImages = getCleanHeroImages();
    if (!cleanHeroImages || cleanHeroImages.length === 0 || cleanHeroImages[0] === '') {
      showError('Error de Validación', 'Debes agregar al menos una imagen del hero');
      return;
    }

    try {
      // Generar slug del proyecto
      const slug = ProjectStorage.generateSlug(formData.title || '');

      // Preparar el proyecto para guardar
      const projectToSave: Omit<Project, 'id'> = {
        title: formData.title || '',
        ...formData,
        slug,
        status: formData.status || 'published',
        featured: false,
        heroImages: cleanHeroImages,
        // Solo incluir tabs si hay al menos uno
        tabs: formData.tabs && formData.tabs.length > 0 ? formData.tabs : undefined,
        // Filtrar valores vacíos
        description: formData.description || `Proyecto ${formData.title}`,
        image: formData.image || cleanHeroImages[0], // Usar la primera imagen del hero como imagen principal
      } as Omit<Project, 'id'>;

      // Validar campos requeridos
      if (!projectToSave.title) {
        showError('Error de Validación', 'El título es requerido');
        return;
      }

      if (!projectToSave.year) {
        showError('Error de Validación', 'El año es requerido');
        return;
      }

      console.log('=== FRONTEND: Sending project to API ===');
      console.log('Project to save:', JSON.stringify(projectToSave, null, 2));
      console.log('Categories:', projectToSave.categories);
      console.log('ShowInHomeHero:', projectToSave.showInHomeHero);
      console.log('Tabs:', projectToSave.tabs);

      // Crear el proyecto
      await ProjectStorage.save(projectToSave as any);

      // Mostrar mensaje de éxito
      showSuccess('Proyecto Creado', 'El proyecto se ha creado exitosamente');

      // Redirigir después de un breve delay para que se vea el mensaje
      setTimeout(() => {
        router.push('/admin/proyectos');
      }, 1500);

    } catch (error: any) {
      if (error.message === 'Este proyecto ya existe') {
        showError('Error de Duplicado', 'Ya existe un proyecto con este título. Por favor, elige otro título.');
      } else {
        console.error('Error saving project:', error);
        showError('Error al Guardar', 'Ha ocurrido un error al guardar el proyecto');
      }
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
    if (!formData.heroImages) return [''];
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

  // Tab management functions
  const addTab = () => {
    const newTab: Omit<ProjectTab, 'id' | 'projectId'> = {
      tabOrder: (formData.tabs?.length || 0),
      title: '',
      heroImages: [''],
      heroImageDescriptions: [''],
      heroImageDescriptions_en: [''],
      additionalImage: '',
      projectDetails: '',
      technicalSheet: '',
      pdfUrl: '',
      pdfButtonText: '',
      pdfButtonText_en: '',
      videoUrl: '',
      title_en: '',
      projectDetails_en: '',
      technicalSheet_en: ''
    } as any;

    const newTabIndex = formData.tabs?.length || 0;

    setFormData({
      ...formData,
      tabs: [...(formData.tabs || []), newTab]
    });

    // Automatically switch to the new tab
    setActiveTabIndex(newTabIndex);
  };

  const removeTab = (index: number) => {
    const newTabs = (formData.tabs || []).filter((_, i) => i !== index);
    // Update tabOrder for remaining tabs
    newTabs.forEach((tab, i) => {
      tab.tabOrder = i;
    });
    setFormData({ ...formData, tabs: newTabs });

    // Update active tab index if necessary
    if (activeTabIndex === index) {
      // If we're deleting the active tab, switch to main content
      setActiveTabIndex(-1);
    } else if (activeTabIndex > index) {
      // If we're deleting a tab before the active one, adjust the index
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const updateTab = (index: number, field: keyof ProjectTab, value: any) => {
    const newTabs = [...(formData.tabs || [])];
    newTabs[index] = { ...newTabs[index], [field]: value };
    setFormData({ ...formData, tabs: newTabs });
  };

  const removeTabHeroImage = (tabIndex: number, imageIndex: number) => {
    const newTabs = [...(formData.tabs || [])];
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

    setFormData({ ...formData, tabs: newTabs });
  };

  return (
    <div>
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nuevo Proyecto</h1>
          <p className="text-gray-600">Crea un nuevo proyecto para tu portafolio</p>
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
            title="Atajo: Shift+Cmd+E (Mac) / Ctrl+Shift+E (Windows)"
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
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Crear Proyecto
          </button>
        </div>
      </div>

      {/* Tab Management */}
      <div className="mb-6 space-y-4">
        {/* Add Tab Button */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={addTab}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Tab
          </button>
        </div>

        {/* Tab Navigation */}
        {formData.tabs && formData.tabs.length > 0 && (
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTabIndex(-1)}
                className={`
                  whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors
                  ${activeTabIndex === -1
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Información Principal
              </button>
              {formData.tabs.map((tab, index) => (
                <div key={index} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTabIndex(index)}
                    className={`
                      whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors
                      ${activeTabIndex === index
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
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
            </nav>
          </div>
        )}
      </div>

      <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
        {/* CONTENIDO PRINCIPAL */}
        {activeTabIndex === -1 ? (
          <>
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
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
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
                    value={formData.createdAt ? formData.createdAt.slice(0, 16) : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Agregar segundos y Z para UTC sin conversión de zona horaria
                        setFormData({ ...formData, createdAt: e.target.value + ':00Z' });
                      } else {
                        setFormData({ ...formData, createdAt: undefined });
                      }
                    }}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Se usará la fecha actual si no se especifica"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controla el orden de visualización. Deja en blanco para usar la fecha actual.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorías * (Selecciona una o más)
                  </label>
                  <div className="bg-white border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="text-gray-500">Cargando categorías...</p>
                    ) : (
                      <div className="space-y-2">
                        {categories.map(cat => (
                          <label key={cat.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={formData.categories?.includes(cat.name) || false}
                              onChange={(e) => {
                                const newCategories = e.target.checked
                                  ? [...(formData.categories || []), cat.name]
                                  : (formData.categories || []).filter(c => c !== cat.name);
                                setFormData({ ...formData, categories: newCategories });
                              }}
                              className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black"
                            />
                            <span className="text-sm">{cat.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.categories && formData.categories.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.categories.length} categoría{formData.categories.length !== 1 ? 's' : ''} seleccionada{formData.categories.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Imágenes */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Imágenes</h2>

              <div className="space-y-6">
                {/* Advertencia si no hay título */}
                {!formData.title && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="text-yellow-600 mt-0.5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Título requerido para subir imágenes</p>
                        <p className="mt-1">
                          Por favor ingresa un título para el proyecto antes de subir imágenes. El título se usará para organizar las imágenes en Cloudinary.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Imágenes del Hero */}
                <div>
                  {!formData.title ? (
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-4 text-sm font-medium text-gray-600">
                        {editingLanguage === 'es' ? 'Imagen del Hero *' : 'Hero Image *'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Ingresa un título para el proyecto arriba para poder subir imágenes
                      </p>
                    </div>
                  ) : (
                    <ImageUploader
                      label={editingLanguage === 'es' ? 'Imagen del Hero *' : 'Hero Image *'}
                      projectId={getProjectFolder()?.split('/').pop() || 'proyecto'}
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
                      required={false}
                      contentType={getProjectFolder() || 'proyectos'}
                      multiple={true}
                      onImagesUpload={(imageUrls) => {
                        if (imageUrls.length > 0) {
                          const currentImages = (formData.heroImages || []).filter(img => img && img.trim() !== '');
                          setFormData({
                            ...formData,
                            heroImages: [...currentImages, ...imageUrls]
                          });
                        }
                      }}
                    />
                  )}

                  {/* Mostrar imágenes del hero cargadas con drag and drop */}
                  <ReorderableImageList
                    images={formData.heroImages || ['']}
                    descriptions={formData.heroImageDescriptions}
                    descriptionsEn={formData.heroImageDescriptions_en}
                    editingLanguage={editingLanguage}
                    onReorder={(newImages, newDescriptions, newDescriptionsEn) => {
                      // Actualizar también formData.image con la primera heroImage
                      const firstImage = newImages.find(img => img && img.trim() !== '') || '';
                      setFormData({
                        ...formData,
                        heroImages: newImages,
                        image: firstImage, // Sincronizar con la primera imagen
                        heroImageDescriptions: newDescriptions,
                        heroImageDescriptions_en: newDescriptionsEn
                      });
                    }}
                    onRemove={(index) => {
                      const newHeroImages = formData.heroImages?.filter((_, i) => i !== index) || [];
                      const newDescriptions = formData.heroImageDescriptions?.filter((_, i) => i !== index) || [];
                      const newDescriptionsEn = formData.heroImageDescriptions_en?.filter((_, i) => i !== index) || [];
                      // Actualizar formData.image con la nueva primera imagen
                      const firstImage = newHeroImages.find(img => img && img.trim() !== '') || '';
                      setFormData({
                        ...formData,
                        heroImages: newHeroImages.length > 0 ? newHeroImages : [''],
                        image: firstImage, // Sincronizar con la primera imagen
                        heroImageDescriptions: newDescriptions,
                        heroImageDescriptions_en: newDescriptionsEn
                      });
                    }}
                    onDescriptionChange={(index, value, language) => {
                      const field = language === 'es' ? 'heroImageDescriptions' : 'heroImageDescriptions_en';
                      const descriptions = [...(formData[field] || [])];
                      while (descriptions.length <= index) {
                        descriptions.push('');
                      }
                      descriptions[index] = value;
                      setFormData({ ...formData, [field]: descriptions });
                    }}
                  />
                </div>

                {/* Imagen Secundaria */}
                <div>
                  {!formData.title ? (
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-4 text-sm font-medium text-gray-600">
                        {editingLanguage === 'es' ? 'Imagen Secundaria' : 'Secondary Image'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Ingresa un título para el proyecto arriba para poder subir imágenes
                      </p>
                    </div>
                  ) : (
                    <ImageUploader
                      label={editingLanguage === 'es' ? 'Imagen Secundaria' : 'Secondary Image'}
                      projectId={getProjectFolder()?.split('/').pop() || 'proyecto'}
                      currentImage={formData.additionalImage}
                      onImageUpload={(imageUrl) => setFormData({ ...formData, additionalImage: imageUrl || '' })}
                      required={false}
                      contentType={getProjectFolder() || 'proyectos'}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Contenido del Proyecto */}
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

            {/* Documento PDF */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Documento PDF</h2>
                <span className="text-sm font-medium text-gray-600">
                  Editando en: {editingLanguage === 'es' ? 'Español' : 'English'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  {!formData.title ? (
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-4 text-sm font-medium text-gray-600">
                        {editingLanguage === 'es' ? 'Documento PDF' : 'PDF Document'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Ingresa un título para el proyecto arriba para poder subir archivos
                      </p>
                    </div>
                  ) : (
                    <ImageUploader
                      label={editingLanguage === 'es' ? 'Subir Documento PDF' : 'Upload PDF Document'}
                      projectId={getProjectFolder()?.split('/').pop() || 'proyecto'}
                      currentImage={formData.pdfUrl}
                      onImageUpload={(fileUrl) => setFormData({ ...formData, pdfUrl: fileUrl || '' })}
                      required={false}
                      contentType={getProjectFolder() || 'proyectos'}
                      accept=".pdf"
                    />
                  )}
                </div>

                {formData.pdfUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {editingLanguage === 'es' ? 'Texto del Botón PDF' : 'PDF Button Text'}
                    </label>
                    <input
                      type="text"
                      value={editingLanguage === 'es' ? (formData.pdfButtonText || '') : (formData.pdfButtonText_en || '')}
                      onChange={(e) => setFormData({
                        ...formData,
                        [editingLanguage === 'es' ? 'pdfButtonText' : 'pdfButtonText_en']: e.target.value
                      })}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder={editingLanguage === 'es' ? 'Ej: Descargar catálogo' : 'Ex: Download catalog'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {editingLanguage === 'es'
                        ? 'Este texto aparecerá en el botón que abre el PDF'
                        : 'This text will appear on the button that opens the PDF'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Video Embed */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Video del Proyecto</h2>
                <span className="text-sm font-medium text-gray-600">
                  Campo compartido entre idiomas
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL del Video (YouTube o Vimeo)
                  </label>
                  <input
                    type="text"
                    value={formData.videoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Pega aquí el enlace completo del video de YouTube o Vimeo. Se mostrará embebido en la página del proyecto.
                  </p>
                </div>

                {/* Video Preview */}
                {formData.videoUrl && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vista Previa del Video
                    </label>
                    <div className="max-w-2xl">
                      {(() => {
                        const url = formData.videoUrl;

                        // YouTube
                        const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                        const youtubeMatch = url.match(youtubeRegex);
                        if (youtubeMatch) {
                          const videoId = youtubeMatch[1];
                          return (
                            <div className="relative w-full" style={{ paddingBottom: '28.125%' }}>
                              <iframe
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                src={`https://www.youtube.com/embed/${videoId}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          );
                        }

                        // Vimeo
                        const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
                        const vimeoMatch = url.match(vimeoRegex);
                        if (vimeoMatch) {
                          const videoId = vimeoMatch[1];
                          return (
                            <div className="relative w-full" style={{ paddingBottom: '28.125%' }}>
                              <iframe
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                src={`https://player.vimeo.com/video/${videoId}`}
                                title="Vimeo video player"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          );
                        }

                        return (
                          <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-600">
                            URL de video no reconocida. Por favor, usa un enlace de YouTube o Vimeo.
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
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
                    value={formData.downloadLink || ''}
                    onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
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
                    value={editingLanguage === 'es' ? (formData.commissionedBy || '') : (formData.commissionedBy_en || '')}
                    onChange={(e) => setFormData({
                      ...formData,
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
                    value={editingLanguage === 'es' ? (formData.curator || '') : (formData.curator_en || '')}
                    onChange={(e) => setFormData({
                      ...formData,
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
                    value={editingLanguage === 'es' ? (formData.location || '') : (formData.location_en || '')}
                    onChange={(e) => setFormData({
                      ...formData,
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
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' | 'archived' })}
                  className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="published">Publicado</option>
                  <option value="draft">Borrador</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          /* CONTENIDO DEL TAB SELECCIONADO */
          formData.tabs && formData.tabs[activeTabIndex] && (() => {
            const tab = formData.tabs[activeTabIndex];

            return (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {tab.title || `Tab ${activeTabIndex + 1}`}
                    </h3>
                    <span className="text-sm font-medium text-gray-600">
                      Editando en: {editingLanguage === 'es' ? 'Español' : 'English'}
                    </span>
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
                          activeTabIndex,
                          editingLanguage === 'es' ? 'title' : 'title_en',
                          e.target.value
                        )}
                        className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                        required={editingLanguage === 'es'}
                      />
                    </div>

                    {/* Advertencia si no hay título del proyecto o del tab */}
                    {(!formData.title || !tab.title) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="text-yellow-600 mt-0.5">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div className="text-sm text-yellow-800">
                            <p className="font-medium">Título requerido para subir imágenes</p>
                            <p className="mt-1">
                              {!formData.title && !tab.title
                                ? 'Por favor ingresa un título para el proyecto Y para este tab antes de subir imágenes.'
                                : !formData.title
                                ? 'Por favor ingresa un título para el proyecto antes de subir imágenes.'
                                : 'Por favor ingresa un título para este tab antes de subir imágenes.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Imágenes del Hero del Tab */}
                    <div>
                      {(!formData.title || !tab.title) ? (
                        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-4 text-sm font-medium text-gray-600">
                            {editingLanguage === 'es' ? 'Imágenes del Hero del Tab' : 'Tab Hero Images'}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {!formData.title
                              ? 'Ingresa un título para el proyecto arriba'
                              : 'Ingresa un título para este tab arriba'}
                          </p>
                        </div>
                      ) : (
                        (() => {
                          // Generate tab folder: proyectos/{project-slug}/{tab-slug}
                          const tabSlug = tab.title
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9\s]/g, '')
                            .trim()
                            .replace(/\s+/g, '-');
                          const tabFolder = `${getProjectFolder()}/${tabSlug}`;

                          return (
                            <ImageUploader
                              label={editingLanguage === 'es' ? 'Imágenes del Hero del Tab' : 'Tab Hero Images'}
                              projectId={tabSlug}
                              currentImage=""
                              onImageUpload={(imageUrl) => {
                                if (imageUrl) {
                                  const newTabs = [...(formData.tabs || [])];
                                  const currentTab = newTabs[activeTabIndex];
                                  const newHeroImages = [...(currentTab.heroImages || [''])];
                                  if (newHeroImages.length === 0 || newHeroImages[0] === '') {
                                    newHeroImages[0] = imageUrl;
                                  } else {
                                    newHeroImages.push(imageUrl);
                                  }
                                  currentTab.heroImages = newHeroImages;
                                  setFormData({ ...formData, tabs: newTabs });
                                }
                              }}
                              required={false}
                              contentType={tabFolder}
                              multiple={true}
                              onImagesUpload={(imageUrls) => {
                                if (imageUrls.length > 0) {
                                  const newTabs = [...(formData.tabs || [])];
                                  const currentTab = newTabs[activeTabIndex];
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
                                  setFormData({ ...formData, tabs: newTabs });
                                }
                              }}
                            />
                          );
                        })()
                      )}

                      {/* Mostrar imágenes del hero del tab */}
                      {tab.heroImages && tab.heroImages.filter(img => img && img.trim() !== '').length > 0 && (
                        <div className="mt-4 space-y-3">
                          {tab.heroImages.filter(img => img && img.trim() !== '').map((image, imgIndex) => {
                            const realImgIndex = tab.heroImages!.findIndex((img, idx) => img === image && idx >= imgIndex);
                            return (
                              <div key={imgIndex} className="flex items-start gap-4 p-3 border border-gray-200 rounded">
                                <img
                                  src={image}
                                  alt={`Tab ${activeTabIndex + 1} Hero ${imgIndex + 1}`}
                                  className="w-24 h-24 object-cover rounded"
                                />
                                <div className="flex-1">
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {editingLanguage === 'es'
                                      ? `Descripción imagen ${imgIndex + 1} (opcional)`
                                      : `Image ${imgIndex + 1} description (optional)`}
                                  </label>
                                  <textarea
                                    value={
                                      editingLanguage === 'es'
                                        ? (tab.heroImageDescriptions?.[realImgIndex] || '')
                                        : (tab.heroImageDescriptions_en?.[realImgIndex] || '')
                                    }
                                    onChange={(e) => {
                                      const newTabs = [...(formData.tabs || [])];
                                      const currentTab = newTabs[activeTabIndex];
                                      const field = editingLanguage === 'es'
                                        ? 'heroImageDescriptions'
                                        : 'heroImageDescriptions_en';
                                      const descriptions = [...(currentTab[field] || [])];
                                      descriptions[realImgIndex] = e.target.value;
                                      currentTab[field] = descriptions;
                                      setFormData({ ...formData, tabs: newTabs });
                                    }}
                                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder={editingLanguage === 'es'
                                      ? 'Descripción de la imagen...'
                                      : 'Image description...'}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeTabHeroImage(activeTabIndex, realImgIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Imagen Secundaria del Tab */}
                    <div>
                      {(!formData.title || !tab.title) ? (
                        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <p className="mt-4 text-sm font-medium text-gray-600">
                            {editingLanguage === 'es' ? 'Imagen Secundaria del Tab' : 'Tab Secondary Image'}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            {!formData.title
                              ? 'Ingresa un título para el proyecto arriba'
                              : 'Ingresa un título para este tab arriba'}
                          </p>
                        </div>
                      ) : (
                        (() => {
                          // Generate tab folder: proyectos/{project-slug}/{tab-slug}
                          const tabSlug = tab.title
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '')
                            .replace(/[^a-z0-9\s]/g, '')
                            .trim()
                            .replace(/\s+/g, '-');
                          const tabFolder = `${getProjectFolder()}/${tabSlug}`;

                          return (
                            <ImageUploader
                              label={editingLanguage === 'es' ? 'Imagen Secundaria del Tab' : 'Tab Secondary Image'}
                              projectId={tabSlug}
                              currentImage={tab.additionalImage}
                              onImageUpload={(imageUrl) => updateTab(activeTabIndex, 'additionalImage', imageUrl)}
                              required={false}
                              contentType={tabFolder}
                            />
                          );
                        })()
                      )}
                    </div>

                    {/* Detalles del Proyecto del Tab */}
                    <div>
                      <RichTextEditor
                        label={editingLanguage === 'es' ? 'Detalles del Proyecto' : 'Project Details'}
                        value={editingLanguage === 'es' ? (tab.projectDetails || '') : (tab.projectDetails_en || '')}
                        onChange={(content) => updateTab(
                          activeTabIndex,
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
                          activeTabIndex,
                          editingLanguage === 'es' ? 'technicalSheet' : 'technicalSheet_en',
                          content
                        )}
                        placeholder={editingLanguage === 'es'
                          ? 'Escribe la ficha técnica para este tab...'
                          : 'Write the technical sheet for this tab...'}
                        height={200}
                      />
                    </div>

                    {/* Documento PDF del Tab */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Documento PDF</h4>
                        <span className="text-xs font-medium text-gray-600">
                          Editando en: {editingLanguage === 'es' ? 'Español' : 'English'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {(!formData.title || !tab.title) ? (
                          <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-3 text-sm font-medium text-gray-600">
                              {editingLanguage === 'es' ? 'Documento PDF' : 'PDF Document'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {!formData.title
                                ? 'Ingresa un título para el proyecto arriba'
                                : 'Ingresa un título para este tab arriba'}
                            </p>
                          </div>
                        ) : (
                          (() => {
                            const tabSlug = tab.title
                              .toLowerCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .replace(/[^a-z0-9\s]/g, '')
                              .trim()
                              .replace(/\s+/g, '-');
                            const tabFolder = `${getProjectFolder()}/${tabSlug}`;

                            return (
                              <ImageUploader
                                label={editingLanguage === 'es' ? 'Subir Documento PDF' : 'Upload PDF Document'}
                                projectId={tabSlug}
                                currentImage={tab.pdfUrl}
                                onImageUpload={(fileUrl) => updateTab(activeTabIndex, 'pdfUrl', fileUrl)}
                                required={false}
                                contentType={tabFolder}
                                accept=".pdf"
                              />
                            );
                          })()
                        )}

                        {tab.pdfUrl && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {editingLanguage === 'es' ? 'Texto del Botón PDF' : 'PDF Button Text'}
                            </label>
                            <input
                              type="text"
                              value={editingLanguage === 'es' ? (tab.pdfButtonText || '') : (tab.pdfButtonText_en || '')}
                              onChange={(e) => updateTab(
                                activeTabIndex,
                                editingLanguage === 'es' ? 'pdfButtonText' : 'pdfButtonText_en',
                                e.target.value
                              )}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                              placeholder={editingLanguage === 'es' ? 'Ej: Descargar catálogo' : 'Ex: Download catalog'}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {editingLanguage === 'es'
                                ? 'Este texto aparecerá en el botón que abre el PDF'
                                : 'This text will appear on the button that opens the PDF'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Video del Tab */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Video del Tab</h4>
                        <span className="text-xs font-medium text-gray-600">
                          Campo compartido entre idiomas
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            URL del Video (YouTube o Vimeo)
                          </label>
                          <input
                            type="text"
                            value={tab.videoUrl || ''}
                            onChange={(e) => updateTab(activeTabIndex, 'videoUrl', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Pega aquí el enlace completo del video de YouTube o Vimeo. Se mostrará embebido en este tab.
                          </p>
                        </div>

                        {/* Vista previa del video */}
                        {tab.videoUrl && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Vista Previa del Video
                            </label>
                            <div className="max-w-md">
                              {(() => {
                                const url = tab.videoUrl;

                                // YouTube
                                const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
                                const youtubeMatch = url.match(youtubeRegex);
                                if (youtubeMatch) {
                                  const videoId = youtubeMatch[1];
                                  return (
                                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                      <iframe
                                        className="absolute top-0 left-0 w-full h-full rounded"
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </div>
                                  );
                                }

                                // Vimeo
                                const vimeoRegex = /(?:vimeo\.com\/)([0-9]+)/;
                                const vimeoMatch = url.match(vimeoRegex);
                                if (vimeoMatch) {
                                  const videoId = vimeoMatch[1];
                                  return (
                                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                      <iframe
                                        className="absolute top-0 left-0 w-full h-full rounded"
                                        src={`https://player.vimeo.com/video/${videoId}`}
                                        title="Vimeo video player"
                                        frameBorder="0"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                      />
                                    </div>
                                  );
                                }

                                return (
                                  <div className="bg-gray-100 rounded p-3 text-xs text-gray-600">
                                    URL de video no reconocida. Por favor, usa un enlace de YouTube o Vimeo.
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
            );
          })()
        )}

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