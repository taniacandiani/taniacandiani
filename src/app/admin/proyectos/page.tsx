'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { PROJECTS } from '@/data/content';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';
import { generateNewsExcerpt } from '@/lib/utils';

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Solo ejecutar migración en el cliente
        if (typeof window !== 'undefined') {
          try {
            // Migrar proyectos existentes a múltiples categorías
            await ProjectStorage.migrateToMultipleCategories();
          } catch (error) {
            console.error('Error durante migración:', error);
          }
        }
        
        // Initialize with existing projects if storage is empty
        const storedProjects = await ProjectStorage.getAll();
        if (storedProjects.length === 0 && !isInitialized) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default projects from content.ts');
          setProjects(PROJECTS);
        } else {
          setProjects(storedProjects);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing projects data:', error);
        // Fallback to static content
        setProjects(PROJECTS);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [isInitialized]);

  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(p => {
        const title = (p.title || '').toLowerCase();
        const description = (p.description || '').toLowerCase();
        const titleEn = (p.title_en || '').toLowerCase();
        const descriptionEn = (p.description_en || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return title.includes(searchLower) ||
               description.includes(searchLower) ||
               titleEn.includes(searchLower) ||
               descriptionEn.includes(searchLower);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  const handleDeleteProject = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este proyecto?')) {
      try {
        await ProjectStorage.delete(id);
        const updatedProjects = await ProjectStorage.getAll();
        setProjects(updatedProjects);
        showSuccess('Proyecto Eliminado', 'El proyecto se ha eliminado correctamente');
      } catch (error) {
        showError('Error al Eliminar', 'Ha ocurrido un error al eliminar el proyecto');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  const publishedProjects = projects.filter(p => p.status === 'published');
  const draftProjects = projects.filter(p => p.status === 'draft');

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: 'Publicado', className: 'bg-green-100 text-green-800' },
      draft: { label: 'Borrador', className: 'bg-yellow-100 text-yellow-800' },
      archived: { label: 'Archivado', className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Proyectos</h1>
          <p className="text-sm text-gray-600">
            Gestiona tus proyectos artísticos. Los proyectos con "Mostrar en Home" aparecen en el carrusel principal.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/proyectos/categorias"
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Gestionar Categorías
          </Link>
          <Link
            href="/admin/proyectos/nuevo"
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Nuevo Proyecto
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="all">Todos los estados</option>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
          <div className="text-sm text-gray-600">Total proyectos</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{publishedProjects.length}</div>
          <div className="text-sm text-gray-600">Publicados</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{draftProjects.length}</div>
          <div className="text-sm text-gray-600">Borradores</div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Cargando proyectos...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No se encontraron proyectos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Título</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Categoría</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Estado</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Fecha</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Año</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">En home</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProjects.map((project) => {
                  // Get thumbnail: prioritize heroImages, then image, then additionalImage
                  const thumbnail = project.heroImages?.[0] || project.image || project.additionalImage || '';

                  return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <Link href={`/admin/proyectos/editar/${project.id}`} className="block hover:text-blue-600">
                        <div className="font-medium text-gray-900 hover:underline">{project.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {generateNewsExcerpt(project.description || project.projectDetails || '', 80)}
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {project.categories && project.categories.length > 0
                        ? project.categories.join(', ')
                        : '-'}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(project.status || 'draft')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {project.year}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-900">
                      {project.showInHomeHero ? (
                        <span className="text-green-600">✓ Sí</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/proyectos/${project.slug}`}
                          target="_blank"
                          className="text-gray-600 hover:text-gray-900"
                          title="Ver"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/proyectos/editar/${project.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
