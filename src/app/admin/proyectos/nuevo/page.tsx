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

export default function NewProjectPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
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
  });

  useEffect(() => {
    // Initialize categories
    const storedCategories = CategoryStorage.getAll();
    if (storedCategories.length === 0) {
      CategoryStorage.saveAll(PROJECT_CATEGORIES);
      setCategories(PROJECT_CATEGORIES);
    } else {
      setCategories(storedCategories);
    }

    // Set default category if we don't have one
    if (!formData.category && storedCategories.length > 0) {
      setFormData(prev => ({ ...prev, category: storedCategories[0].name }));
    }
  }, [formData.category]);

  // Ensure form always has at least one hero image slot
  useEffect(() => {
    if (!formData.heroImages || formData.heroImages.length === 0) {
      setFormData(prev => ({ ...prev, heroImages: [''] }));
    }
  }, [formData.heroImages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Por favor completa al menos el título');
      return;
    }
    
    const cleanHeroImages = getCleanHeroImages();
    
    // Validar que haya al menos una imagen del hero
    if (!cleanHeroImages || cleanHeroImages.length === 0 || cleanHeroImages[0] === '') {
      alert('Debes agregar al menos una imagen del hero');
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

    ProjectStorage.save(newProject);
    
    // Dispatch event to notify other components about the update
    window.dispatchEvent(new CustomEvent('projectsUpdated'));
    
    // Mostrar mensaje de éxito y limpiar el formulario
    alert('Proyecto creado exitosamente');
    
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
        <Link
          href="/admin/proyectos"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Ver Proyectos
        </Link>
        
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subtítulo
              </label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
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
                <div>
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Imagen del Hero * <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Campo único para agregar múltiples imágenes del hero */}
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400"
                      onClick={() => document.getElementById('hero-images-input-new')?.click()}
                    >
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="font-medium">Arrastra una imagen aquí o imágenes</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF hasta 5MB</p>
                      </div>
                      
                      {/* Input de archivo oculto */}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            Array.from(e.target.files).forEach(file => {
                              // Simular upload para cada archivo
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const imageUrl = event.target?.result as string;
                                const newHeroImages = [...(formData.heroImages || [''])];
                                if (newHeroImages.length === 0 || newHeroImages[0] === '') {
                                  newHeroImages[0] = imageUrl;
                                } else {
                                  newHeroImages.push(imageUrl);
                                }
                                setFormData({ ...formData, heroImages: newHeroImages });
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                        className="hidden"
                        id="hero-images-input-new"
                      />
                    </div>
                    
                    {/* Mostrar miniaturas de las imágenes cargadas */}
                    {formData.heroImages && formData.heroImages.filter(img => img && img.trim() !== '').length > 0 && (
                      <div className="space-y-3">
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
                                const newHeroImages = [...formData.heroImages];
                                newHeroImages[index] = '';
                                setFormData({ ...formData, heroImages: newHeroImages });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <ImageUploader
                    label="Imagen Secundaria"
                    projectId="new"
                    currentImage={formData.image}
                    onImageUpload={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
                    required={false}
                  />
                </div>
              </div>

          
        </div>

        {/* Contenido */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido del Proyecto</h2>
          
          <div className="space-y-6">
            <div>
              <RichTextEditor
                label="Detalles del Proyecto"
                value={formData.projectDetails || ''}
                onChange={(content) => setFormData({ ...formData, projectDetails: content })}
                placeholder="Escribe los detalles del proyecto aquí..."
                height={250}
              />
            </div>

            <div>
              <RichTextEditor
                label="Ficha Técnica"
                value={formData.technicalSheet || ''}
                onChange={(content) => setFormData({ ...formData, technicalSheet: content })}
                placeholder="Escribe la ficha técnica aquí..."
                height={250}
              />
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link de Descarga
              </label>
              <input
                type="text"
                value={formData.downloadLink || ''}
                onChange={(e) => setFormData({ ...formData, downloadLink: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comisionado por
              </label>
              <input
                type="text"
                value={formData.commissionedBy || ''}
                onChange={(e) => setFormData({ ...formData, commissionedBy: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curador/a
              </label>
              <input
                type="text"
                value={formData.curator || ''}
                onChange={(e) => setFormData({ ...formData, curator: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                />
                <span className="text-sm font-medium text-gray-700">
                  Mostrar en el hero de la página principal
                </span>
              </label>
            </div>

            {formData.showInHomeHero && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción para el Hero
                </label>
                <textarea
                  value={formData.heroDescription || ''}
                  onChange={(e) => setFormData({ ...formData, heroDescription: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Descripción que aparecerá en el hero de la página principal"
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
    </div>
  );
}
