'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ContactContent } from '@/types';
import { ContactStorage } from '@/lib/contactStorage';
import { CONTACT_CONTENT } from '@/data/content';

export default function AdminContactPage() {
  const [content, setContent] = useState<ContactContent>(CONTACT_CONTENT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = ContactStorage.get();
    if (stored) {
      setContent(stored);
    } else {
      ContactStorage.save(CONTACT_CONTENT);
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: ContactContent = {
        ...content,
        lastUpdated: new Date().toISOString(),
      };
      ContactStorage.save(updated);
      setContent(updated);
      alert('Contenido de Contacto guardado correctamente');
    } catch (error) {
      console.error('Error al guardar contacto:', error);
      alert('Error al guardar el contenido');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const stored = ContactStorage.get();
    setContent(stored || CONTACT_CONTENT);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contenido de Contacto</h1>
        </div>
        <div className="flex gap-4">
          <Link
            href="/contacto"
            target="_blank"
            className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
          >
            👁️ Ver página
          </Link>
        </div>
      </div>

      {/* Action Buttons - Top */}
      <div className="flex justify-end gap-4 pt-4 border-b border-gray-200 pb-4">
        <button type="button" onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Título de la página</label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Texto debajo del título</label>
            <textarea
              rows={6}
              value={content.description}
              onChange={(e) => setContent({ ...content, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Escribe aquí el texto descriptivo que aparecerá debajo del título en la página de Contacto."
            />
          </div>

          {/* Action Buttons - Bottom */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button type="button" onClick={handleCancel} className="px-4 py-2 text-gray-600 hover:text-gray-800">
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
