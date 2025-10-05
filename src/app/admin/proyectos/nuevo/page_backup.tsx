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
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function NewProjectPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [editingLanguage, setEditingLanguage] = useState<'es' | 'en'>('es');

  // Generate temporary folder once for this session
  const tempFolder = useMemo(() => `proyectos/temp-${Date.now()}`, []);

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
    // English fields
    title_en: '',
    projectDetails_en: '',
    technicalSheet_en: '',
    heroDescription_en: '',
    commissionedBy_en: '',
    curator_en: '',
    location_en: '',
  });

  const [editingTabLanguage, setEditingTabLanguage] = useState<{ [key: number]: 'es' | 'en' }>({});
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

        // No need to set default categories anymore - user will select them
      } catch (error) {
        console.error('Error initializing categories:', error);
        // Fallback to static content
        setCategories(PROJECT_CATEGORIES);
      }
    };

    initializeCategories();
  }, []);

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

    // Validar que haya al menos una categoría seleccionada
    if (!formData.categories || formData.categories.length === 0) {
      showError('Error de Validación', 'Debes seleccionar al menos una categoría');
      return;
    }

    const cleanHeroImages = getCleanHeroImages();

    // Validar que haya al menos una imagen del hero
    if (!cleanHeroImages || cleanHeroImages.length === 0 || cleanHeroImages[0] === '') {
      showError('Error de Validación', 'Debes agregar al menos una imagen del hero');
      return;
    }

    try {
      // Generate final folder name based on project title
      const projectSlug = ProjectStorage.generateSlug(formData.title!);
      const finalFolder = `proyectos/${projectSlug}`;

      // Combine all images to move
      const allImagesToMove = [...cleanHeroImages];
      if (formData.image) {
        allImagesToMove.push(formData.image);
      }

      // Move images from temp folder to final folder using API
      const moveResponse = await fetch('/api/move-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrls: allImagesToMove,
          tempFolder,
          finalFolder
        })
      });

      if (!moveResponse.ok) {
        throw new Error('Error al mover las imágenes');
      }

      const { newUrls } = await moveResponse.json();

      // Split back into hero images and secondary image
      const movedHeroImages = newUrls.slice(0, cleanHeroImages.length);
      const movedSecondaryImage = formData.image && newUrls.length > cleanHeroImages.length
        ? newUrls[cleanHeroImages.length]
        : '';

      const newProject: Project = {
        ...formData as Project,
        id: ProjectStorage.generateId(),
        slug: projectSlug,
        status: 'published',
        heroImages: movedHeroImages,
        image: movedSecondaryImage || ''
      };

      console.log('Guardando proyecto con descripciones:', {
        heroImages: newProject.heroImages,
        heroImageDescriptions: newProject.heroImageDescriptions,
        heroImageDescriptions_en: newProject.heroImageDescriptions_en
      });

      await ProjectStorage.save(newProject);

      // Dispatch event to notify other components about the update
      window.dispatchEvent(new CustomEvent('projectsUpdated'));

      // Mostrar mensaje de éxito y limpiar el formulario
      showSuccess('Proyecto Creado', 'El proyecto se ha creado exitosamente');

      // Limpiar el formulario para crear otro proyecto
      setFormData({
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
        // English fields
        title_en: '',
        projectDetails_en: '',
        technicalSheet_en: '',
        heroDescription_en: '',
        commissionedBy_en: '',
        curator_en: '',
        location_en: '',
      });
      setEditingTabLanguage({});
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

  // Tab management functions
  const addTab = () => {
    const newTab: ProjectTab = {
      id: `tab-${Date.now()}`,
      projectId: '',
      tabOrder: (formData.tabs?.length || 0),
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

    const newTabIndex = formData.tabs?.length || 0;

    setFormData({
      ...formData,
      tabs: [...(formData.tabs || []), newTab]
    });

    // Set language for the new tab
    setEditingTabLanguage({
      ...editingTabLanguage,
      [newTabIndex]: 'es'
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

    // Update language state
    const newLanguageState = { ...editingTabLanguage };
    delete newLanguageState[index];
    // Reindex remaining tabs
    const reindexed: { [key: number]: 'es' | 'en' } = {};
    Object.keys(newLanguageState).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex > index) {
        reindexed[oldIndex - 1] = newLanguageState[oldIndex];
      } else {
        reindexed[oldIndex] = newLanguageState[oldIndex];
      }
    });
    setEditingTabLanguage(reindexed);

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

  const handleTabHeroImageChange = (tabIndex: number, imageIndex: number, value: string) => {
    const newTabs = [...(formData.tabs || [])];
    const newHeroImages = [...(newTabs[tabIndex].heroImages || [''])];
    newHeroImages[imageIndex] = value;
    newTabs[tabIndex] = { ...newTabs[tabIndex], heroImages: newHeroImages };
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
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabIndex(index)}
                  className={`
                    whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2
                    ${activeTabIndex === index
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.title || `Tab ${index + 1}`}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(index);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      <form id="project-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Show main content if no tab is selected, otherwise show tab content */}
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
                            const currentCategories = formData.categories || [];
                            if (e.target.checked) {
                              setFormData({ ...formData, categories: [...currentCategories, cat.name] });
                            } else {
                              setFormData({
                                ...formData,
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
                  projectId={tempFolder.split('/').pop() || 'temp'}
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
                  contentType={tempFolder}
                  multiple={true}
                  onImagesUpload={(imageUrls) => {
                    if (imageUrls.length > 0) {
                      // Obtener las imágenes actuales que no están vacías
                      const currentImages = (formData.heroImages || []).filter(img => img && img.trim() !== '');
                      // Agregar las nuevas imágenes
                      const newHeroImages = [...currentImages, ...imageUrls];

                      // Agregar espacios vacíos para descripciones de nuevas imágenes
                      const currentDescriptions = formData.heroImageDescriptions || [];
                      const currentDescriptions_en = formData.heroImageDescriptions_en || [];
                      const newDescriptions = [...currentDescriptions];
                      const newDescriptions_en = [...currentDescriptions_en];

                      // Asegurar que hay un slot de descripción por cada imagen
                      while (newDescriptions.length < newHeroImages.length) {
                        newDescriptions.push('');
                      }
                      while (newDescriptions_en.length < newHeroImages.length) {
                        newDescriptions_en.push('');
                      }

                      setFormData({
                        ...formData,
                        heroImages: newHeroImages,
                        heroImageDescriptions: newDescriptions,
                        heroImageDescriptions_en: newDescriptions_en
                      });
                    }
                  }}
                />

              {/* Mostrar miniaturas de las imágenes cargadas */}
              {formData.heroImages && formData.heroImages.filter(img => img && img.trim() !== '').length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 font-medium mb-3">Imágenes del Hero cargadas:</p>
                  <div className="space-y-4">
                    {formData.heroImages.filter(img => img && img.trim() !== '').map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex gap-4 items-start">
                          <div className="relative flex-shrink-0">
                            <img
                              src={image}
                              alt={`Imagen del hero ${index + 1}`}
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newHeroImages = [...(formData.heroImages || [])];
                                const newDescriptions = [...(formData.heroImageDescriptions || [])];
                                const newDescriptions_en = [...(formData.heroImageDescriptions_en || [])];

                                newHeroImages.splice(index, 1);
                                newDescriptions.splice(index, 1);
                                newDescriptions_en.splice(index, 1);

                                setFormData({
                                  ...formData,
                                  heroImages: newHeroImages.length > 0 ? newHeroImages : [''],
                                  heroImageDescriptions: newDescriptions,
                                  heroImageDescriptions_en: newDescriptions_en
                                });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>

                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {editingLanguage === 'es' ? `Descripción imagen ${index + 1} (opcional)` : `Image ${index + 1} description (optional)`}
                            </label>
                            <textarea
                              value={
                                editingLanguage === 'es'
                                  ? (formData.heroImageDescriptions?.[index] || '')
                                  : (formData.heroImageDescriptions_en?.[index] || '')
                              }
                              onChange={(e) => {
                                const newDescriptions = editingLanguage === 'es'
                                  ? [...(formData.heroImageDescriptions || [])]
                                  : [...(formData.heroImageDescriptions_en || [])];

                                newDescriptions[index] = e.target.value;

                                setFormData({
                                  ...formData,
                                  [editingLanguage === 'es' ? 'heroImageDescriptions' : 'heroImageDescriptions_en']: newDescriptions
                                });
                              }}
                              className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-black resize-none"
                              placeholder={editingLanguage === 'es' ? 'Descripción que aparecerá en el slider del proyecto...' : 'Description that will appear in the project slider...'}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {editingLanguage === 'es' ? 'Esta descripción se mostrará en el slider del proyecto' : 'This description will be shown in the project slider'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <ImageUploader
                label="Imagen Secundaria"
                projectId={tempFolder.split('/').pop() || 'temp'}
                currentImage={formData.image}
                onImageUpload={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
                required={false}
                contentType={tempFolder}
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
          </>
        ) : (
          /* Show selected tab content */
          formData.tabs && formData.tabs[activeTabIndex] && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {formData.tabs[activeTabIndex].title || `Tab ${activeTabIndex + 1}`}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingTabLanguage({
                      ...editingTabLanguage,
                      [activeTabIndex]: (editingTabLanguage[activeTabIndex] || 'es') === 'es' ? 'en' : 'es'
                    })}
                    className="text-sm px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50"
                  >
                    {(editingTabLanguage[activeTabIndex] || 'es') === 'es' ? 'English' : 'Español'}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {/* Título del Tab */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {(editingTabLanguage[activeTabIndex] || 'es') === 'es' ? 'Título del Tab *' : 'Tab Title *'}
                  </label>
                  <input
                    type="text"
                    value={(editingTabLanguage[activeTabIndex] || 'es') === 'es'
                      ? formData.tabs[activeTabIndex].title
                      : (formData.tabs[activeTabIndex].title_en || '')}
                    onChange={(e) => updateTab(
                      activeTabIndex,
                      (editingTabLanguage[activeTabIndex] || 'es') === 'es' ? 'title' : 'title_en',
                      e.target.value
                    )}
                    className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    required={(editingTabLanguage[activeTabIndex] || 'es') === 'es'}
                  />
                </div>

                {/* Imágenes del Hero del Tab */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {(editingTabLanguage[activeTabIndex] || 'es') === 'es' ? 'Imágenes del Hero del Tab' : 'Tab Hero Images'}
                    </label>
                    <input
                      type="text"
                      value={(editingTabLanguage[tabIndex] || 'es') === 'es' ? tab.title : (tab.title_en || '')}
                      onChange={(e) => updateTab(
                        tabIndex,
                        (editingTabLanguage[tabIndex] || 'es') === 'es' ? 'title' : 'title_en',
                        e.target.value
                      )}
                      className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                      required={(editingTabLanguage[tabIndex] || 'es') === 'es'}
                    />
                  </div>

                  {/* Imágenes del Hero del Tab */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {(editingTabLanguage[tabIndex] || 'es') === 'es' ? 'Imágenes del Hero del Tab' : 'Tab Hero Images'}
                    </label>
                    <ImageUploader
                      label=""
                      projectId={tempFolder.split('/').pop() || 'temp'}
                      currentImage=""
                      onImageUpload={(imageUrl) => {
                        if (imageUrl) {
                          const newTabs = [...(formData.tabs || [])];
                          const tab = newTabs[tabIndex];
                          const newHeroImages = [...(tab.heroImages || [''])];
                          if (newHeroImages.length === 0 || newHeroImages[0] === '') {
                            newHeroImages[0] = imageUrl;
                          } else {
                            newHeroImages.push(imageUrl);
                          }
                          tab.heroImages = newHeroImages;
                          setFormData({ ...formData, tabs: newTabs });
                        }
                      }}
                      required={false}
                      contentType={tempFolder}
                      multiple={true}
                      onImagesUpload={(imageUrls) => {
                        if (imageUrls.length > 0) {
                          const newTabs = [...(formData.tabs || [])];
                          const tab = newTabs[tabIndex];
                          const currentImages = (tab.heroImages || []).filter(img => img && img.trim() !== '');
                          const newHeroImages = [...currentImages, ...imageUrls];

                          // Actualizar descripciones
                          const currentDescriptions = tab.heroImageDescriptions || [];
                          const currentDescriptionsEn = tab.heroImageDescriptions_en || [];
                          const newDescriptions = [...currentDescriptions];
                          const newDescriptionsEn = [...currentDescriptionsEn];

                          while (newDescriptions.length < newHeroImages.length) {
                            newDescriptions.push('');
                          }
                          while (newDescriptionsEn.length < newHeroImages.length) {
                            newDescriptionsEn.push('');
                          }

                          tab.heroImages = newHeroImages;
                          tab.heroImageDescriptions = newDescriptions;
                          tab.heroImageDescriptions_en = newDescriptionsEn;
                          setFormData({ ...formData, tabs: newTabs });
                        }
                      }}
                    />

                    {/* Mostrar imágenes del hero del tab */}
                    {tab.heroImages && tab.heroImages.filter(img => img && img.trim() !== '').length > 0 && (
                      <div className="mt-4 space-y-3">
                        {tab.heroImages.filter(img => img && img.trim() !== '').map((image, imgIndex) => (
                          <div key={imgIndex} className="flex items-start gap-4 p-3 border border-gray-200 rounded">
                            <img
                              src={image}
                              alt={`Tab ${tabIndex + 1} Hero ${imgIndex + 1}`}
                              className="w-24 h-24 object-cover rounded"
                            />
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {(editingTabLanguage[tabIndex] || 'es') === 'es'
                                  ? `Descripción imagen ${imgIndex + 1} (opcional)`
                                  : `Image ${imgIndex + 1} description (optional)`}
                              </label>
                              <textarea
                                value={
                                  (editingTabLanguage[tabIndex] || 'es') === 'es'
                                    ? (tab.heroImageDescriptions?.[imgIndex] || '')
                                    : (tab.heroImageDescriptions_en?.[imgIndex] || '')
                                }
                                onChange={(e) => {
                                  const newTabs = [...(formData.tabs || [])];
                                  const currentTab = newTabs[tabIndex];
                                  const field = (editingTabLanguage[tabIndex] || 'es') === 'es'
                                    ? 'heroImageDescriptions'
                                    : 'heroImageDescriptions_en';
                                  const descriptions = [...(currentTab[field] || [])];
                                  descriptions[imgIndex] = e.target.value;
                                  currentTab[field] = descriptions;
                                  setFormData({ ...formData, tabs: newTabs });
                                }}
                                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder={(editingTabLanguage[tabIndex] || 'es') === 'es'
                                  ? 'Descripción de la imagen...'
                                  : 'Image description...'}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTabHeroImage(tabIndex, imgIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Imagen Secundaria del Tab */}
                  <div>
                    <ImageUploader
                      label={(editingTabLanguage[tabIndex] || 'es') === 'es' ? 'Imagen Secundaria del Tab' : 'Tab Secondary Image'}
                      projectId={tempFolder.split('/').pop() || 'temp'}
                      currentImage={tab.additionalImage}
                      onImageUpload={(imageUrl) => updateTab(tabIndex, 'additionalImage', imageUrl)}
                      required={false}
                      contentType={tempFolder}
                    />
                  </div>

                  {/* Detalles del Proyecto del Tab */}
                  <div>
                    <RichTextEditor
                      label={(editingTabLanguage[tabIndex] || 'es') === 'es' ? 'Detalles del Proyecto' : 'Project Details'}
                      value={(editingTabLanguage[tabIndex] || 'es') === 'es' ? (tab.projectDetails || '') : (tab.projectDetails_en || '')}
                      onChange={(content) => updateTab(
                        tabIndex,
                        (editingTabLanguage[tabIndex] || 'es') === 'es' ? 'projectDetails' : 'projectDetails_en',
                        content
                      )}
                      placeholder={(editingTabLanguage[tabIndex] || 'es') === 'es'
                        ? 'Escribe los detalles del proyecto para este tab...'
                        : 'Write the project details for this tab...'}
                      height={200}
                    />
                  </div>

                  {/* Ficha Técnica del Tab */}
                  <div>
                    <RichTextEditor
                      label={(editingTabLanguage[tabIndex] || 'es') === 'es' ? 'Ficha Técnica' : 'Technical Sheet'}
                      value={(editingTabLanguage[tabIndex] || 'es') === 'es' ? (tab.technicalSheet || '') : (tab.technicalSheet_en || '')}
                      onChange={(content) => updateTab(
                        tabIndex,
                        (editingTabLanguage[tabIndex] || 'es') === 'es' ? 'technicalSheet' : 'technicalSheet_en',
                        content
                      )}
                      placeholder={(editingTabLanguage[tabIndex] || 'es') === 'es'
                        ? 'Escribe la ficha técnica para este tab...'
                        : 'Write the technical sheet for this tab...'}
                      height={200}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
