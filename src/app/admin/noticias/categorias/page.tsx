'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { NewsCategoryStorage, NewsCategory } from '@/lib/newsCategoryStorage';
import { NEWS_CATEGORIES } from '@/data/content';
import { generateSlug } from '@/lib/utils';

export default function NewsCategoriasPage() {
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState<NewsCategory | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const storedCategories = NewsCategoryStorage.getAll();
    if (storedCategories.length === 0) {
      NewsCategoryStorage.saveAll(NEWS_CATEGORIES);
      setCategories(NEWS_CATEGORIES);
    } else {
      setCategories(storedCategories);
    }
  };

  const generateId = (name: string) => {
    return generateSlug(name);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Por favor ingresa un nombre para la categoría');
      return;
    }

    const id = generateId(newCategoryName);
    const existingCategory = categories.find(c => c.id === id || c.name === newCategoryName.trim());
    
    if (existingCategory) {
      alert('Ya existe una categoría con ese nombre');
      return;
    }

    const newCategory: NewsCategory = {
      id,
      name: newCategoryName.trim(),
      count: 0,
      description: newCategoryDescription.trim() || undefined
    };

    NewsCategoryStorage.save(newCategory);
    loadCategories();
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const handleEditCategory = (category: NewsCategory) => {
    setEditingCategory({ ...category });
  };

  const handleSaveEdit = () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      alert('Por favor ingresa un nombre para la categoría');
      return;
    }

    // Check if name conflicts with other categories (excluding current)
    const conflictingCategory = categories.find(c => 
      c.id !== editingCategory.id && 
      (c.name === editingCategory.name.trim() || c.id === generateId(editingCategory.name))
    );
    
    if (conflictingCategory) {
      alert('Ya existe una categoría con ese nombre');
      return;
    }

    const updatedCategory: NewsCategory = {
      ...editingCategory,
      name: editingCategory.name.trim(),
      description: editingCategory.description?.trim() || undefined
    };

    NewsCategoryStorage.save(updatedCategory);
    loadCategories();
    setEditingCategory(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;

    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
      const result = NewsCategoryStorage.delete(id);
      if (result.success) {
        loadCategories();
      } else {
        alert(result.message);
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

      {/* Add New Category */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Agregar Nueva Categoría</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Categoría *
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej: Exposiciones, Conferencias..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <input
              type="text"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Descripción de la categoría..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleAddCategory}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
          >
            Agregar Categoría
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Categorías Existentes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {categories.length} categoría(s) registrada(s)
          </p>
        </div>

        {categories.length === 0 ? (
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
                      {editingCategory?.id === category.id ? (
                        <input
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{category.name}</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-500 font-mono">
                      {category.id}
                    </td>
                    <td className="py-3 px-6">
                      {editingCategory?.id === category.id ? (
                        <input
                          type="text"
                          value={editingCategory.description || ''}
                          onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          placeholder="Descripción opcional"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">
                          {category.description || '-'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {category.count} noticias
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      {editingCategory?.id === category.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
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
                      )}
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
    </div>
  );
}
