'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AboutContent } from '@/types';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useNotification } from '@/components/ui/Notification';
import ToastNotification from '@/components/ui/Notification';

export default function AdminAboutPage() {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingLanguage, setEditingLanguage] = useState<'es' | 'en'>('es');
  const { showSuccess, showError, notification, hideNotification } = useNotification();

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        console.log('Cargando contenido...');
        
        const response = await fetch('/api/about');
        if (response.ok) {
          const data = await response.json();
          console.log('Contenido cargado:', data);
          setContent(data);
        } else {
          console.log('No se pudo cargar el contenido');
          setContent(null);
        }
      } catch (error) {
        console.error('Error cargando contenido:', error);
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
      
      const response = await fetch('/api/about', {
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
      const response = await fetch('/api/about');
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
      <div className="flex justify-between items-center pt-4 border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={() => setEditingLanguage(editingLanguage === 'es' ? 'en' : 'es')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          {editingLanguage === 'es' ? 'English' : 'Español'}
        </button>

        <div className="flex gap-4">
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

      {/* Last Updated Info */}
      {content && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Última actualización:</span> {formatDate(content.lastUpdated)}
          </div>
        </div>
      )}

      {/* Content Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando contenido...</p>
            </div>
          </div>
        ) : content ? (
          <div className="space-y-6">
            {/* Language Indicator */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Editando en:</span> {editingLanguage === 'es' ? 'Español' : 'English'}
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editingLanguage === 'es' ? 'Título de la página' : 'Page Title'}
              </label>
              <input
                type="text"
                value={editingLanguage === 'es' ? (content?.title || '') : (content?.title_en || '')}
                onChange={(e) => setContent({
                  ...content!,
                  [editingLanguage === 'es' ? 'title' : 'title_en']: e.target.value
                })}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Content */}
            <div>
              <RichTextEditor
                label={editingLanguage === 'es' ? 'Contenido' : 'Content'}
                value={editingLanguage === 'es' ? (content?.content || '') : (content?.content_en || '')}
                onChange={(newContent) => setContent({
                  ...content!,
                  [editingLanguage === 'es' ? 'content' : 'content_en']: newContent
                })}
                placeholder={editingLanguage === 'es' ? 'Escribe el contenido aquí...' : 'Write the content here...'}
                height={400}
              />
            </div>

            {/* Action Buttons - Bottom */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setEditingLanguage(editingLanguage === 'es' ? 'en' : 'es')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {editingLanguage === 'es' ? 'English' : 'Español'}
              </button>

              <div className="flex gap-4">
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
        ) : (
          <div className="text-center py-12">
            <button
              onClick={() => setContent({
                id: 'about-content',
                title: '',
                content: '',
                lastUpdated: new Date().toISOString()
              })}
              className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Crear Contenido
            </button>
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
