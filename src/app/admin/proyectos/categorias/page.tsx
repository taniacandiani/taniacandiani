'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProjectCategory } from '@/types';
import { CategoryStorage } from '@/lib/categoryStorage';
import { PROJECT_CATEGORIES } from '@/data/content';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';
import CategoryEditor from '@/components/admin/CategoryEditor';

export default function AdminCategories() {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Initialize with existing categories if storage is empty
        const storedCategories = await CategoryStorage.getAll();
        if (storedCategories.length === 0 && !isInitialized) {
          // Note: saveAll is not implemented in the new async version
          // We'll rely on the JSON files for now
          console.log('Using default categories from content.ts');
          setCategories(PROJECT_CATEGORIES);
        } else {
          setCategories(storedCategories);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing categories:', error);
        // Fallback to static content
        setCategories(PROJECT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [isInitialized]);

  // Update counts when component mounts
  useEffect(() => {
    if (categories.length > 0) {
      const updateCategoryCounts = async () => {
        try {
          const updatedCategories = await CategoryStorage.updateCounts();
          setCategories(updatedCategories);
        } catch (error) {
          console.error('Error updating category counts:', error);
        }
      };

      updateCategoryCounts();
    }
  }, [categories.length]);

  const handleSaveCategory = async (categoryData: Partial<ProjectCategory>) => {
    if (!categoryData.name?.trim()) {
      showError('Error de Validación', 'Por favor ingresa un nombre para la categoría');
      return;
    }

    // Check if category name already exists
    const existingCategory = categories.find(cat =>
      cat.name.toLowerCase() === categoryData.name!.trim().toLowerCase() &&
      cat.id !== editingCategory?.id
    );

    if (existingCategory) {
      showError('Error de Validación', 'Ya existe una categoría con ese nombre');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const updatedCategory: ProjectCategory = {
          ...editingCategory,
          ...categoryData,
          name: categoryData.name!.trim(),
          nameEn: categoryData.nameEn?.trim() || undefined,
          description: categoryData.description?.trim() || undefined,
          descriptionEn: categoryData.descriptionEn?.trim() || undefined
        };
        await CategoryStorage.save(updatedCategory);
        showSuccess('Categoría Actualizada', 'La categoría se ha actualizado correctamente');
      } else {
        // Create new category
        const newCategory: ProjectCategory = {
          id: CategoryStorage.generateSlug(categoryData.name!),
          name: categoryData.name!.trim(),
          nameEn: categoryData.nameEn?.trim() || undefined,
          count: 0,
          description: categoryData.description?.trim() || undefined,
          descriptionEn: categoryData.descriptionEn?.trim() || undefined
        };
        await CategoryStorage.save(newCategory);
        showSuccess('Categoría Creada', 'La categoría se ha creado correctamente');
      }

      // Refresh categories and update counts
      const updatedCategories = await CategoryStorage.updateCounts();
      setCategories(updatedCategories);

      // Reset form
      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      showError('Error al Guardar', 'Ha ocurrido un error al guardar la categoría');
    }
  };

  const handleEditCategory = (category: ProjectCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDeleteCategory = async (category: ProjectCategory) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
      try {
        const result = await CategoryStorage.delete(category.id);
        
        if (result.success) {
          const updatedCategories = await CategoryStorage.updateCounts();
          setCategories(updatedCategories);
          showSuccess('Categoría Eliminada', 'La categoría se ha eliminado correctamente');
        } else {
          showError('Error al Eliminar', result.message);
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        showError('Error al Eliminar', 'Ha ocurrido un error al eliminar la categoría');
      }
    }
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Categorías</h1>
          <p className="text-gray-600">Administra las categorías de proyectos</p>
        </div>
        <Link
          href="/admin/proyectos"
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          ← Volver a Proyectos
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Total Categorías</p>
              <p className="text-xl font-bold text-purple-900">{categories.length}</p>
            </div>
            <div className="text-purple-500 text-2xl">🏷️</div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">En Uso</p>
              <p className="text-xl font-bold text-green-900">
                {categories.filter(cat => cat.count > 0).length}
              </p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Sin Usar</p>
              <p className="text-xl font-bold text-gray-900">
                {categories.filter(cat => cat.count === 0).length}
              </p>
            </div>
            <div className="text-gray-500 text-2xl">📂</div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <CategoryEditor
          category={editingCategory}
          onSave={handleSaveCategory}
          onCancel={handleCancel}
          type="project"
        />
      )}

      {/* Lista de categorías */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Categorías Existentes</h2>
          <button
            onClick={handleNewCategory}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm"
          >
            + Nueva Categoría
          </button>
        </div>
        
        {categories.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🏷️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primera categoría</p>
            <button
              onClick={handleNewCategory}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Crear Primera Categoría
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proyectos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">🏷️</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{category.name}</div>
                          {category.nameEn && (
                            <div className="text-sm text-gray-500">{category.nameEn}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {category.description || (
                          <span className="text-gray-400 italic">Sin descripción</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{category.count}</span>
                        <span className="text-sm text-gray-500 ml-1">proyectos</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.count > 0 ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          En uso
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Sin usar
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link
                        href={`/proyectos?category=${encodeURIComponent(category.name)}`}
                        target="_blank"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver proyectos
                      </Link>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className={`${
                          category.count > 0 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        disabled={category.count > 0}
                        title={category.count > 0 ? 'No se puede eliminar: categoría en uso' : 'Eliminar categoría'}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="text-blue-500 text-xl mr-3">💡</div>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">Información importante</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Las categorías en uso no pueden ser eliminadas hasta que no tengan proyectos asociados</li>
              <li>• Al editar una categoría, el cambio se aplicará a todos los proyectos que la usen</li>
              <li>• Los contadores se actualizan automáticamente al crear, editar o eliminar proyectos</li>
            </ul>
          </div>
        </div>
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
