'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  projectId: string;
  currentImage?: string;
  label: string;
  required?: boolean;
  multiple?: boolean;
  onImagesUpload?: (imageUrls: string[]) => void;
}

export default function ImageUploader({ 
  onImageUpload, 
  projectId, 
  currentImage, 
  label, 
  required = false,
  multiple = false,
  onImagesUpload
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
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
    </div>
  );
}
