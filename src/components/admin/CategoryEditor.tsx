'use client';

import { useState } from 'react';
import { ProjectCategory, NewsCategory } from '@/types';

interface CategoryEditorProps {
  category?: ProjectCategory | NewsCategory | null;
  onSave: (category: Partial<ProjectCategory | NewsCategory>) => Promise<void>;
  onCancel: () => void;
  type: 'project' | 'news';
}

export default function CategoryEditor({ category, onSave, onCancel, type }: CategoryEditorProps) {
  const [isEnglish, setIsEnglish] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || '',
    nameEn: category?.nameEn || '',
    description: category?.description || '',
    descriptionEn: category?.descriptionEn || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...category,
      ...formData,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {category ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>

        {/* Language Toggle Button - Positioned on the right */}
        <button
          type="button"
          onClick={() => setIsEnglish(!isEnglish)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {isEnglish ? 'Español' : 'English'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Spanish Fields (shown when isEnglish is false) */}
        {!isEnglish && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={type === 'project' ? 'Ej: Arte Digital' : 'Ej: Exposiciones'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Descripción breve de la categoría..."
              />
            </div>
          </>
        )}

        {/* English Fields (shown when isEnglish is true) */}
        {isEnglish && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name (English) *
              </label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={type === 'project' ? 'E.g: Digital Art' : 'E.g: Exhibitions'}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 h-20 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Brief category description..."
              />
            </div>
          </>
        )}

        {/* Language Indicator */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
          {isEnglish ? (
            <span>✏️ Currently editing: <strong>English content</strong></span>
          ) : (
            <span>✏️ Editando actualmente: <strong>Contenido en español</strong></span>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            {category ? 'Actualizar' : 'Crear'} Categoría
          </button>
        </div>
      </form>
    </div>
  );
}