'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContactContent } from '@/types';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function AdminContactPage() {
  const [content, setContent] = useState<ContactContent | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        console.log('Cargando contenido de contacto...');
        
        const response = await fetch('/api/contact');
        if (response.ok) {
          const data = await response.json();
          console.log('Contenido de contacto cargado:', data);
          setContent(data);
        } else {
          console.log('No se pudo cargar el contenido de contacto');
          setContent(null);
        }
      } catch (error) {
        console.error('Error cargando contenido de contacto:', error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const handleSave = async () => {
    if (!content) return;
    
    setSaving(true);
    try {
      const updatedContent = {
        ...content,
        lastUpdated: new Date().toISOString()
      };
      
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedContent),
      });
      
      if (response.ok) {
        setContent(updatedContent);
        showSuccess('Contenido Guardado', 'El contenido se ha guardado correctamente');
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      showError('Error al Guardar', 'Ha ocurrido un error al guardar el contenido');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch('/api/contact');
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      } else {
        setContent(null);
      }
    } catch (error) {
      console.error('Error restaurando contenido:', error);
      setContent(null);
    }
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

  if (loading) {
    return <div className="text-center py-8">Cargando contenido...</div>;
  }

  if (!content) {
    return <div className="text-center py-8">No se pudo cargar el contenido de contacto.</div>;
  }

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
