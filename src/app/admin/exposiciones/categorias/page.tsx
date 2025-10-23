'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExhibitionCategory } from '@/types';
import { ExhibitionCategoryStorage } from '@/lib/exhibitionCategoryStorage';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function AdminExhibitionCategoriesPage() {
  const [categories, setCategories] = useState<ExhibitionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    descriptionEn: ''
  });
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await ExhibitionCategoryStorage.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Error', 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      showError('Error', 'El nombre es requerido');
      return;
    }

    try {
      const newCategory = await ExhibitionCategoryStorage.create({
        name: formData.name,
        nameEn: formData.nameEn,
        description: formData.description,
        descriptionEn: formData.descriptionEn
      });

      if (newCategory) {
        showSuccess('Éxito', 'Categoría creada correctamente');
        setShowNewForm(false);
        setFormData({ name: '', nameEn: '', description: '', descriptionEn: '' });
        fetchCategories();
        // Update counts
        await ExhibitionCategoryStorage.updateCounts();
      }
    } catch (error) {
      console.error('Error creating category:', error);
      showError('Error', 'No se pudo crear la categoría');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const updated = await ExhibitionCategoryStorage.update(id, formData);
      if (updated) {
        showSuccess('Éxito', 'Categoría actualizada correctamente');
        setIsEditing(null);
        setFormData({ name: '', nameEn: '', description: '', descriptionEn: '' });
        fetchCategories();
        // Update counts
        await ExhibitionCategoryStorage.updateCounts();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      showError('Error', 'No se pudo actualizar la categoría');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    // Don't allow deletion of "Activas" category only
    if (name === 'Activas') {
      showError('Error', 'La categoría "Activas" no se puede eliminar');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${name}"?`)) {
      return;
    }

    try {
      const success = await ExhibitionCategoryStorage.delete(id);
      if (success) {
        showSuccess('Éxito', 'Categoría eliminada correctamente');
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('Error', 'No se pudo eliminar la categoría');
    }
  };

  const startEdit = (category: ExhibitionCategory) => {
    setIsEditing(category.id);
    setFormData({
      name: category.name,
      nameEn: category.nameEn || '',
      description: category.description || '',
      descriptionEn: category.descriptionEn || ''
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setFormData({ name: '', nameEn: '', description: '', descriptionEn: '' });
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <ToastNotification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin/exposiciones" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
            ← Volver a exposiciones
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Categorías de Exposiciones</h1>
          <p className="text-gray-600 mt-2">Gestiona las categorías para organizar las exposiciones</p>
        </div>
        <button
          onClick={() => {
            setShowNewForm(true);
            setFormData({ name: '', nameEn: '', description: '', descriptionEn: '' });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nueva Categoría
        </button>
      </div>

      {/* New Category Form */}
      {showNewForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Nueva Categoría</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre (Español) *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Individuales"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre (English)
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Solo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (Español)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Descripción opcional..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (English)
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Optional description..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowNewForm(false);
                setFormData({ name: '', nameEn: '', description: '', descriptionEn: '' });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crear Categoría
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre (EN)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exposiciones
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No hay categorías aún.
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id}>
                  {isEditing === category.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={formData.nameEn}
                          onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="w-full p-1 border border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {category.count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdate(category.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                          {category.name === 'Activas' && (
                            <span className="ml-2 text-xs text-gray-500">(Protegida)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{category.nameEn || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {category.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {category.count}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => startEdit(category)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {category.name !== 'Activas' && (
                            <button
                              onClick={() => handleDelete(category.id, category.name)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Counts Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={async () => {
            try {
              await ExhibitionCategoryStorage.updateCounts();
              showSuccess('Éxito', 'Contadores actualizados');
              fetchCategories();
            } catch (error) {
              showError('Error', 'No se pudieron actualizar los contadores');
            }
          }}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Actualizar Contadores
        </button>
      </div>
    </div>
  );
}