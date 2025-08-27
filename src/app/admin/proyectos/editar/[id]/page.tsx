'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Project, ProjectCategory } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { CategoryStorage } from '@/lib/categoryStorage';
import { PROJECT_CATEGORIES } from '@/data/content';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setSaving(true);
    try {
      const updatedProject: Project = {
        ...project,
        slug: ProjectStorage.generateSlug(project.title)
      };

      ProjectStorage.save(updatedProject);
      router.push('/admin/proyectos');
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
    setProject({ 
      ...project, 
      heroImages: [...(project.heroImages || []), ''] 
    });
  };

  const removeHeroImage = (index: number) => {
    if (!project) return;
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
      <div className="flex justify-end gap-4 mb-8 pt-4 border-b border-gray-200 pb-4">
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
                Categoría *
              </label>
              <select
                value={project.category}
                onChange={(e) => setProject({ ...project, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
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
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imágenes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen Principal *
              </label>
              <input
                type="text"
                value={project.image}
                onChange={(e) => setProject({ ...project, image: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="/ruta/a/imagen.jpg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen Adicional
              </label>
              <input
                type="text"
                value={project.additionalImage || ''}
                onChange={(e) => setProject({ ...project, additionalImage: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="/ruta/a/imagen.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes del Hero/Slider
            </label>
            {(project.heroImages || ['']).map((image, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => handleHeroImageChange(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="/ruta/a/imagen.jpg"
                />
                {(project.heroImages || []).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHeroImage(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addHeroImage}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Agregar imagen
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido del Proyecto</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detalles del Proyecto (HTML)
              </label>
              <textarea
                value={project.projectDetails || ''}
                onChange={(e) => setProject({ ...project, projectDetails: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="<p>Descripción detallada del proyecto...</p>"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ficha Técnica (HTML)
              </label>
              <textarea
                value={project.technicalSheet || ''}
                onChange={(e) => setProject({ ...project, technicalSheet: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="<p><strong>Técnica:</strong> Descripción...</p>"
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
        <div className="bg-gray-50 p-6 rounded-lg">
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
