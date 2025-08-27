'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, ProjectCategory } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { CategoryStorage } from '@/lib/categoryStorage';
import { PROJECT_CATEGORIES } from '@/data/content';
import RichTextEditor from '@/components/ui/RichTextEditor';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Por favor completa al menos el título');
      return;
    }
    
    const newProject: Project = {
      ...formData as Project,
      id: ProjectStorage.generateId(),
      slug: ProjectStorage.generateSlug(formData.title!),
      status: 'published'
    };

    ProjectStorage.save(newProject);
    router.push('/admin/proyectos');
  };

  const handleHeroImageChange = (index: number, value: string) => {
    const newHeroImages = [...(formData.heroImages || [''])];
    newHeroImages[index] = value;
    setFormData({ ...formData, heroImages: newHeroImages });
  };

  const addHeroImage = () => {
    setFormData({ 
      ...formData, 
      heroImages: [...(formData.heroImages || []), ''] 
    });
  };

  const removeHeroImage = (index: number) => {
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
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Crear Proyecto
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen Principal *
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
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
                value={formData.additionalImage || ''}
                onChange={(e) => setFormData({ ...formData, additionalImage: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="/ruta/a/imagen.jpg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes del Hero/Slider
            </label>
            {(formData.heroImages || ['']).map((image, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => handleHeroImageChange(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="/ruta/a/imagen.jpg"
                />
                {(formData.heroImages || []).length > 1 && (
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
