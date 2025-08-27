'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AboutContent } from '@/types';
import { AboutStorage } from '@/lib/aboutStorage';
import { ABOUT_CONTENT } from '@/data/content';
import RichTextEditor from '@/components/ui/RichTextEditor';

export default function AdminAboutPage() {
  const [content, setContent] = useState<AboutContent>(ABOUT_CONTENT);
  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load existing content or initialize with default
    const storedContent = AboutStorage.get();
    if (storedContent) {
      setContent(storedContent);
    } else {
      AboutStorage.save(ABOUT_CONTENT);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedContent = {
        ...content,
        lastUpdated: new Date().toISOString()
      };
      
      AboutStorage.save(updatedContent);
      setContent(updatedContent);
      alert('Contenido guardado correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar el contenido');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to stored content
    const storedContent = AboutStorage.get();
    if (storedContent) {
      setContent(storedContent);
    } else {
      setContent(ABOUT_CONTENT);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contenido de Acerca</h1>
          <p className="text-sm text-gray-600 mt-1">
            Administra el contenido de la página "Acerca"
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            href="/acerca"
            target="_blank"
            className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
          >
            👁️ Ver página
          </Link>
          <Link
            href="/admin/acerca/publicaciones"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm"
          >
            Gestionar Publicaciones
          </Link>
        </div>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex justify-end gap-4 pt-4 border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Last Updated Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <span className="font-medium">Última actualización:</span> {formatDate(content.lastUpdated)}
        </div>
      </div>

      {/* Content Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título de la página
            </label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Content */}
          <div>
            <RichTextEditor
              label="Contenido"
              value={content.content}
              onChange={(newContent) => setContent({ ...content, content: newContent })}
              placeholder="Escribe el contenido aquí..."
              height={400}
            />
          </div>

          {/* Action Buttons - Bottom */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
