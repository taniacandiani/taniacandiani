'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { ProjectStorage } from '@/lib/projectStorage';
import { PROJECTS } from '@/data/content';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Proyectos</h1>
          <p className="text-gray-600">Administra todos tus proyectos artísticos</p>
        </div>
        <Link
          href="/admin/proyectos/nuevo"
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          Nuevo Proyecto
        </Link>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total</p>
              <p className="text-xl font-bold text-blue-900">{projects.length}</p>
            </div>
            <div className="text-blue-500 text-2xl">📊</div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Publicados</p>
              <p className="text-xl font-bold text-green-900">{publishedProjects.length}</p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Borradores</p>
              <p className="text-xl font-bold text-yellow-900">{draftProjects.length}</p>
            </div>
            <div className="text-yellow-500 text-2xl">📝</div>
          </div>
        </div>
      </div>

      {/* Lista de proyectos */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Todos los Proyectos</h2>
        </div>
        
        {projects.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🎨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primer proyecto artístico</p>
            <Link
              href="/admin/proyectos/nuevo"
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Crear Primer Proyecto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proyecto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    En Home
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded object-cover"
                            src={project.image}
                            alt={project.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{project.title}</div>
                          <div className="text-sm text-gray-500">{project.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.categories?.join(', ') || 'Sin categoría'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        project.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : project.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'published' ? 'Publicado' : 
                         project.status === 'draft' ? 'Borrador' : 'Archivado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.showInHomeHero ? (
                        <span className="text-green-600">✓ Sí</span>
                      ) : (
                        <span className="text-gray-400">✗ No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium w-40">
                      <div className="flex items-center justify-center gap-3">
                        <Link
                          href={`/proyectos/${project.slug}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        >
                          Ver
                        </Link>
                        <Link
                          href={`/admin/proyectos/editar/${project.id}`}
                          className="text-indigo-600 hover:text-indigo-900 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enlaces relacionados */}
      <div className="mt-8 flex justify-between items-center">
        <Link
          href="/admin/proyectos/categorias"
          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
        >
          🏷️ Gestionar Categorías
        </Link>
        <Link
          href="/admin"
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          ← Volver al Dashboard
        </Link>
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
