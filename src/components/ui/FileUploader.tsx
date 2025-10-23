'use client';

import { useState, useRef } from 'react';
import MediaSelector from './MediaSelector';

interface FileUploaderProps {
  onFileUpload: (fileUrl: string) => void;
  projectId: string;
  currentFile?: string;
  label: string;
  required?: boolean;
  contentType?: string; // 'proyectos', 'noticias', 'acerca', etc.
  acceptPDF?: boolean; // Si se aceptan PDFs
  acceptImages?: boolean; // Si se aceptan imágenes
}

export default function FileUploader({
  onFileUpload,
  projectId,
  currentFile,
  label,
  required = false,
  contentType = 'acerca/publicaciones',
  acceptPDF = true,
  acceptImages = true
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determinar el tipo de archivo actual
  const currentFileIsPDF = currentFile?.toLowerCase().endsWith('.pdf');
  const currentFileIsImage = currentFile && !currentFileIsPDF;

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const isPDF = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');

    // Validar tipo de archivo según lo permitido
    if (!acceptPDF && isPDF) {
      return { valid: false, error: 'No se permiten archivos PDF' };
    }
    if (!acceptImages && isImage) {
      return { valid: false, error: 'No se permiten archivos de imagen' };
    }
    if (!isPDF && !isImage) {
      return { valid: false, error: 'Solo se permiten archivos PDF o imágenes' };
    }

    // Validar tamaño (20MB máximo)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return { valid: false, error: `Tamaño: ${fileSizeMB}MB (máximo 20MB)` };
    }

    return { valid: true };
  };

  const handleFileUpload = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Archivo inválido');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('contentType', contentType);

      const response = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const { fileUrl } = await response.json();
      onFileUpload(fileUrl);
    } catch (error) {
      setError('Error al subir el archivo. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleMediaSelect = (fileUrl: string) => {
    onFileUpload(fileUrl);
    setShowMediaSelector(false);
  };

  // Construir el atributo accept para el input
  const getAcceptAttribute = () => {
    const types: string[] = [];
    if (acceptImages) types.push('image/*');
    if (acceptPDF) types.push('application/pdf');
    return types.join(',');
  };

  // Construir el texto de descripción
  const getDescriptionText = () => {
    if (acceptImages && acceptPDF) return 'PNG, JPG, GIF o PDF hasta 20MB';
    if (acceptImages) return 'PNG, JPG, GIF hasta 20MB';
    if (acceptPDF) return 'PDF hasta 20MB';
    return 'Archivo hasta 20MB';
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptAttribute()}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Botones de acción */}
      <div className="flex gap-3 mb-3">
        <button
          type="button"
          onClick={() => setShowMediaSelector(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>Seleccionar del Media</span>
        </button>

        <button
          type="button"
          onClick={openFileDialog}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Subir Nuevo Archivo</span>
        </button>
      </div>

      {/* Área de drag & drop */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Subiendo archivo...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              <p className="font-medium">
                Arrastra un archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getDescriptionText()}
              </p>
              {acceptImages && (
                <p className="text-xs text-gray-400 mt-1">
                  Las imágenes se subirán con la máxima calidad posible (hasta 4000px)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Archivo actual */}
      {currentFile && (
        <div className="relative inline-block">
          {currentFileIsPDF ? (
            // Preview para PDF
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  PDF Actual
                </p>
                <a
                  href={currentFile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver documento
                </a>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileUpload('');
                }}
                className="flex-shrink-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ) : (
            // Preview para imagen
            <>
              <img
                src={currentFile}
                alt="Archivo actual"
                className="w-24 h-24 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileUpload('');
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 z-10"
              >
                ×
              </button>
            </>
          )}
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* MediaSelector - solo mostrar para imágenes */}
      {acceptImages && (
        <MediaSelector
          isOpen={showMediaSelector}
          onClose={() => setShowMediaSelector(false)}
          onSelect={handleMediaSelect}
          currentImage={currentFile}
          title={`Seleccionar ${label}`}
          contentType={contentType}
        />
      )}
    </div>
  );
}
