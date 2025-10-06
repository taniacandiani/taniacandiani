'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NewsCategoryStorage, NewsCategory } from '@/lib/newsCategoryStorage';
import { NEWS_CATEGORIES } from '@/data/content';
import { generateSlug } from '@/lib/utils';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';
import CategoryEditor from '@/components/admin/CategoryEditor';

export default function NewsCategoriasPage() {
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<NewsCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await loadCategories();
      } catch (error) {
        console.error('Error initializing categories:', error);
        // Fallback to static content
        setCategories(NEWS_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadCategories = async () => {
    try {
      const storedCategories = await NewsCategoryStorage.getAll();
      if (storedCategories.length === 0) {
        // Note: saveAll is not implemented in the new async version
        // We'll rely on the JSON files for now
        console.log('Using default categories from content.ts');
        setCategories(NEWS_CATEGORIES);
      } else {
        setCategories(storedCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to static content
      setCategories(NEWS_CATEGORIES);
    }
  };

  const generateId = (name: string) => {
    return generateSlug(name);
  };

  const handleSaveCategory = async (categoryData: Partial<NewsCategory>) => {
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
        const updatedCategory: NewsCategory = {
          ...editingCategory,
          ...categoryData,
          name: categoryData.name!.trim(),
          nameEn: categoryData.nameEn?.trim() || undefined,
          description: categoryData.description?.trim() || undefined,
          descriptionEn: categoryData.descriptionEn?.trim() || undefined
        };
        await NewsCategoryStorage.save(updatedCategory);
        showSuccess('Categoría Actualizada', 'La categoría se ha actualizado correctamente');
      } else {
        // Create new category
        const newCategory: NewsCategory = {
          id: generateId(categoryData.name!),
          name: categoryData.name!.trim(),
          nameEn: categoryData.nameEn?.trim() || undefined,
          count: 0,
          description: categoryData.description?.trim() || undefined,
          descriptionEn: categoryData.descriptionEn?.trim() || undefined
        };
        await NewsCategoryStorage.save(newCategory);
        showSuccess('Categoría Creada', 'La categoría se ha creado correctamente');
      }

      await loadCategories();
      setShowForm(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      showError('Error al Guardar', 'Ha ocurrido un error al guardar la categoría');
    }
  };

  const handleEditCategory = (category: NewsCategory) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
      try {
        const result = await NewsCategoryStorage.delete(id);
        if (result.success) {
          await loadCategories();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Categorías de Noticias</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestiona las categorías para organizar las noticias del sitio web.
          </p>
        </div>
        <Link
          href="/admin/noticias"
          className="text-gray-600 hover:text-gray-800"
        >
          ← Volver a noticias
        </Link>
      </div>

      {/* Category Form */}
      {showForm && (
        <CategoryEditor
          category={editingCategory}
          onSave={handleSaveCategory}
          onCancel={handleCancel}
          type="news"
        />
      )}

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Categorías Existentes</h2>
            <p className="text-sm text-gray-600 mt-1">
              {categories.length} categoría(s) registrada(s)
            </p>
          </div>
          {!showForm && (
            <button
              onClick={handleNewCategory}
              className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm"
            >
              + Nueva Categoría
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No hay categorías registradas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Nombre</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">ID</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Descripción</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Noticias</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="py-3 px-6">
                      <span className="font-medium text-gray-900">{category.name}</span>
                      {category.nameEn && (
                        <span className="text-sm text-gray-500 block">{category.nameEn}</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-500 font-mono">
                      {category.id}
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-sm text-gray-600">
                        {category.description || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category.count} noticias
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                          disabled={category.count > 0}
                          title={category.count > 0 ? 'No se puede eliminar porque tiene noticias asociadas' : 'Eliminar categoría'}
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

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Información sobre las categorías
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Las categorías se usan para organizar las noticias del sitio web</li>
                <li>No puedes eliminar una categoría que tenga noticias asociadas</li>
                <li>El ID se genera automáticamente basado en el nombre</li>
                <li>Los cambios se reflejan inmediatamente en el sitio público</li>
              </ul>
            </div>
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
