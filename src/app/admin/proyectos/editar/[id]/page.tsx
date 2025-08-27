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

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Migrar proyectos existentes a múltiples categorías
    ProjectStorage.migrateToMultipleCategories();
    
    // Initialize categories
    const storedCategories = CategoryStorage.getAll();
    if (storedCategories.length === 0) {
      CategoryStorage.saveAll(PROJECT_CATEGORIES);
      setCategories(PROJECT_CATEGORIES);
    } else {
      setCategories(storedCategories);
    }

    // Load project
    const loadProject = async () => {
      const id = await params.id as string;
      if (id) {
        const foundProject = ProjectStorage.getById(id);
        if (foundProject) {
          setProject(foundProject);
        } else {
          router.push('/admin/proyectos');
        }
      }
      setLoading(false);
    };

    loadProject();
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
      alert('Debes seleccionar al menos una categoría');
      return;
    }

    // Validar que haya al menos una imagen del hero
    const cleanHeroImages = getCleanHeroImages();
    if (!cleanHeroImages || cleanHeroImages.length === 0 || cleanHeroImages[0] === '') {
      alert('Debes agregar al menos una imagen del hero');
      return;
    }

    setSaving(true);
    try {
      const updatedProject: Project = {
        ...project,
        slug: ProjectStorage.generateSlug(project.title),
        heroImages: cleanHeroImages,
        // Mantener la imagen secundaria separada del hero
        image: project.image || ''
      };

      ProjectStorage.save(updatedProject);
      
      // Dispatch event to notify other components about the update
      window.dispatchEvent(new CustomEvent('projectsUpdated'));
      
      // Mostrar mensaje de éxito en lugar de redirigir
      alert('Proyecto guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el proyecto');
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => setProject({ ...project, title: e.target.value })}
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
                value={project.subtitle || ''}
                onChange={(e) => setProject({ ...project, subtitle: e.target.value })}
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
                    
                    {/* Campo único para agregar múltiples imágenes del hero */}
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-gray-400"
                      onClick={() => document.getElementById('hero-images-input')?.click()}
                    >
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-9 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
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
                                const newHeroImages = [...(project.heroImages || [''])];
                                if (newHeroImages.length === 0 || newHeroImages[0] === '') {
                                  newHeroImages[0] = imageUrl;
                                } else {
                                  newHeroImages.push(imageUrl);
                                }
                                setProject({ ...project, heroImages: newHeroImages });
                              };
                              reader.readAsDataURL(file);
                            });
                          }
                        }}
                        className="hidden"
                        id="hero-images-input"
                      />
                    </div>
                    
                    {/* Mostrar miniaturas de las imágenes cargadas */}
                    {project.heroImages && project.heroImages.filter(img => img && img.trim() !== '').length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {project.heroImages.filter(img => img && img.trim() !== '').map((image, index) => (
                          <div key={index} className="relative inline-block">
                            <img
                              src={image}
                              alt={`Imagen del hero ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newHeroImages = [...project.heroImages];
                                newHeroImages[index] = '';
                                setProject({ ...project, heroImages: newHeroImages });
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
                    projectId={project.id}
                    currentImage={project.image}
                    onImageUpload={(imageUrl) => setProject({ ...project, image: imageUrl })}
                    required={false}
                  />
                </div>
              </div>

          
        </div>

        {/* Contenido */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido del Proyecto</h2>
          
          <div className="space-y-6">
            <div>
              <RichTextEditor
                label="Detalles del Proyecto"
                value={project.projectDetails || ''}
                onChange={(content) => setProject({ ...project, projectDetails: content })}
                placeholder="Escribe los detalles del proyecto aquí..."
                height={250}
              />
            </div>

            <div>
              <RichTextEditor
                label="Ficha Técnica"
                value={project.technicalSheet || ''}
                onChange={(content) => setProject({ ...project, technicalSheet: content })}
                placeholder="Escribe la ficha técnica aquí..."
                height={250}
              />
            </div>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Adicional</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link de Descarga
              </label>
              <input
                type="text"
                value={project.downloadLink || ''}
                onChange={(e) => setProject({ ...project, downloadLink: e.target.value })}
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
                value={project.commissionedBy || ''}
                onChange={(e) => setProject({ ...project, commissionedBy: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Curador/a
              </label>
              <input
                type="text"
                value={project.curator || ''}
                onChange={(e) => setProject({ ...project, curator: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                value={project.location || ''}
                onChange={(e) => setProject({ ...project, location: e.target.value })}
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
                />
                <span className="text-sm font-medium text-gray-700">
                  Mostrar en el hero de la página principal
                </span>
              </label>
            </div>

            {project.showInHomeHero && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción para el Hero
                </label>
                <textarea
                  value={project.heroDescription || ''}
                  onChange={(e) => setProject({ ...project, heroDescription: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Descripción que aparecerá en el hero de la página principal"
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
    </div>
  );
}
