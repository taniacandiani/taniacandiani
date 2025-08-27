'use client';

import { useState, useRef } from 'react';
import MediaSelector from './MediaSelector';

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  projectId: string;
  currentImage?: string;
  label: string;
  required?: boolean;
  multiple?: boolean;
  onImagesUpload?: (imageUrls: string[]) => void;
  contentType?: string; // 'proyectos', 'noticias', 'acerca', etc.
}

export default function ImageUploader({ 
  onImageUpload, 
  projectId, 
  currentImage, 
  label, 
  required = false,
  multiple = false,
  onImagesUpload,
  contentType = 'proyectos'
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen');
      return false;
    }
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('projectId', projectId);
      formData.append('contentType', contentType);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }
      
      const { imageUrl } = await response.json();
      onImageUpload(imageUrl);
    } catch (error) {
      setError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleMultipleFileUpload = async (files: FileList) => {
    setUploading(true);
    setError('');
    
    try {
      const imageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!validateFile(file)) continue;
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('projectId', projectId);
        formData.append('contentType', contentType);
        
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Error al subir la imagen');
        }
        
        const { imageUrl } = await response.json();
        imageUrls.push(imageUrl);
      }
      
      if (onImagesUpload && imageUrls.length > 0) {
        onImagesUpload(imageUrls);
      }
    } catch (error) {
      setError('Error al subir las imágenes. Intenta de nuevo.');
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
      if (multiple) {
        handleMultipleFileUpload(e.dataTransfer.files);
      } else {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (multiple) {
        handleMultipleFileUpload(e.target.files);
      } else {
        handleFileUpload(e.target.files[0]);
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleMediaSelect = (imageUrl: string) => {
    onImageUpload(imageUrl);
    setShowMediaSelector(false);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
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
          <span>Subir Nueva Imagen</span>
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
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Subiendo imagen...</p>
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
                {multiple ? 'Arrastra múltiples imágenes aquí o haz clic para seleccionar' : 'Arrastra una imagen aquí o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF hasta 5MB
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Imagen actual */}
      {currentImage && (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Imagen actual"
            className="w-18 h-18 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={() => onImageUpload('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 z-10"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* MediaSelector */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelect}
        currentImage={currentImage}
        title={`Seleccionar ${label}`}
        contentType={contentType}
      />
    </div>
  );
}
