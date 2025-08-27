'use client';

import { useState, useEffect } from 'react';
import { FiFolder, FiFile, FiImage, FiTrash2, FiEye } from 'react-icons/fi';

interface MediaFile {
  name: string;
  path: string;
  type: 'image' | 'document' | 'folder';
  size?: string;
  lastModified?: string;
}

interface MediaFolder {
  name: string;
  path: string;
  files: MediaFile[];
  subfolders: MediaFolder[];
}

export default function MediaPage() {
  const [mediaStructure, setMediaStructure] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [currentPath, setCurrentPath] = useState('/uploads');
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Simular la carga de la estructura de archivos
    // En un caso real, esto vendría de una API
    loadMediaStructure();
  }, []);

  const loadMediaStructure = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media');
      if (!response.ok) {
        throw new Error('Error al cargar la estructura de archivos');
      }
      
      const data = await response.json();
      console.log('Media structure loaded:', data.structure);
      setMediaStructure(data.structure || []);
    } catch (error) {
      console.error('Error loading media structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: MediaFile) => {
    if (file.type === 'folder') return <FiFolder className="h-6 w-6 text-blue-500" />;
    if (file.type === 'image') return <FiImage className="h-6 w-6 text-green-500" />;
    return <FiFile className="h-6 w-6 text-gray-500" />;
  };

  const handleFileClick = (file: MediaFile) => {
    if (file.type === 'image') {
      setSelectedFile(file);
      setImageLoading(true);
      setImageError(null);
      
      // Verificar si la imagen existe
      const img = new Image();
      img.onload = () => {
        setImageLoading(false);
        setImageError(null);
      };
      img.onerror = () => {
        setImageLoading(false);
        setImageError('La imagen no se pudo cargar');
      };
      img.src = file.path;
    }
  };

  const handleDeleteFile = async (file: MediaFile) => {
    if (confirm(`¿Estás seguro de que quieres eliminar ${file.name}?`)) {
      try {
        const response = await fetch('/api/media/delete', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filePath: file.path.substring(1) }) // Remover el slash inicial
        });

        if (!response.ok) {
          throw new Error('Error al eliminar el archivo');
        }

        // Recargar la estructura después de eliminar
        await loadMediaStructure();
        
        // Si el archivo seleccionado era el eliminado, limpiar la selección
        if (selectedFile?.path === file.path) {
          setSelectedFile(null);
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Error al eliminar el archivo. Intenta de nuevo.');
      }
    }
  };

  const renderMediaItem = (item: MediaFile | MediaFolder, isFolder = false) => (
    <div
      key={item.path}
      className={`flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors ${
        isFolder ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
      }`}
      onClick={() => isFolder ? setCurrentPath(item.path) : handleFileClick(item as MediaFile)}
    >
      <div className="flex items-center space-x-3">
        {getFileIcon(item as MediaFile)}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-sm text-gray-500 truncate">{item.path}</p>
          {!isFolder && (item as MediaFile).size && (
            <p className="text-xs text-gray-400">
              {(item as MediaFile).size} • {(item as MediaFile).lastModified}
            </p>
          )}
        </div>
      </div>
      
      {!isFolder && (
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(item as MediaFile);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Ver archivo"
          >
            <FiEye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFile(item as MediaFile);
            }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Eliminar archivo"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );

  const renderBreadcrumb = () => {
    const paths = currentPath.split('/').filter(Boolean);
    return (
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <button
          onClick={() => setCurrentPath('/uploads')}
          className="hover:text-gray-700 transition-colors"
        >
          Media
        </button>
        {paths.map((path, index) => (
          <div key={index} className="flex items-center space-x-2">
            <span>/</span>
            <button
              onClick={() => {
                const newPath = '/' + paths.slice(0, index + 1).join('/');
                setCurrentPath(newPath);
              }}
              className="hover:text-gray-700 transition-colors"
            >
              {path}
            </button>
          </div>
        ))}
      </nav>
    );
  };

  const getCurrentFolder = (): MediaFolder | null => {
    if (currentPath === '/uploads') {
      // Para la vista raíz, devolver la carpeta uploads principal
      return mediaStructure.length > 0 ? mediaStructure[0] : null;
    }
    
    const findFolder = (folders: MediaFolder[], targetPath: string): MediaFolder | null => {
      for (const folder of folders) {
        if (folder.path === targetPath) return folder;
        const found = findFolder(folder.subfolders, targetPath);
        if (found) return found;
      }
      return null;
    };
    
    return findFolder(mediaStructure, currentPath);
  };

  const currentFolder = getCurrentFolder();
  
  // Debug: mostrar la estructura actual
  console.log('Current path:', currentPath);
  console.log('Media structure:', mediaStructure);
  console.log('Current folder:', currentFolder);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Media</h1>
          <p className="text-gray-600">Gestiona todos los archivos subidos a tu sitio web</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadMediaStructure}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <div className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            <span>Recargar</span>
          </button>
          
          <button
            onClick={async () => {
              if (confirm('¿Quieres migrar las imágenes de noticias a la carpeta correcta? Esto moverá las carpetas "new-news" y "noticia-1" de proyectos a noticias.')) {
                try {
                  const response = await fetch('/api/media/migrate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'migrate-news-images' })
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    alert(`Migración completada. ${result.totalMigrated} carpetas migradas.`);
                    loadMediaStructure(); // Recargar la estructura
                  } else {
                    throw new Error('Error en la migración');
                  }
                } catch (error) {
                  alert('Error durante la migración: ' + error.message);
                }
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Migrar Noticias</span>
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Upload</span>
          </button>
        </div>
      </div>

      {renderBreadcrumb()}
      
      {/* Mensaje de ayuda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <div className="text-blue-600 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Navegación de Media</p>
            <p className="mt-1">
              <strong>Vista actual:</strong> {currentPath === '/uploads' ? 'Carpeta raíz (uploads)' : `Carpeta: ${currentPath}`}
            </p>
            <p className="mt-1">
              Haz clic en las carpetas para navegar dentro de ellas. Haz clic en las imágenes para ver la vista previa en el panel derecho.
            </p>
          </div>
        </div>
      </div>
      
      {currentPath !== '/uploads' && (
        <div className="mb-4">
          <button
            onClick={() => {
              const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/uploads';
              setCurrentPath(parentPath);
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Volver atrás</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de archivos y carpetas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                {currentPath === '/uploads' ? 'Carpetas de Media' : currentFolder?.name || 'Media'}
              </h2>
              <p className="text-sm text-gray-500">
                Ruta actual: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{currentPath}</code>
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Mostrar carpetas y archivos del folder actual */}
              {currentFolder?.subfolders?.map((folder) => renderMediaItem(folder, true))}
              {currentFolder?.files?.map((file) => renderMediaItem(file))}
              
              {/* Mensaje cuando no hay contenido */}
              {(!currentFolder?.subfolders?.length && !currentFolder?.files?.length) && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-medium">
                    {currentPath === '/uploads' ? 'No hay archivos o carpetas' : 'Esta carpeta está vacía'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {currentPath === '/uploads' ? 'La carpeta uploads está vacía' : 'No hay archivos o subcarpetas en esta ubicación'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panel de vista previa */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h3>
            
            {selectedFile ? (
              <div className="space-y-4">
                {selectedFile.type === 'image' && (
                  <div className="relative">
                    {imageLoading && (
                      <div className="w-full h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Cargando imagen...</p>
                        </div>
                      </div>
                    )}
                    
                    <img
                      src={selectedFile.path}
                      alt={selectedFile.name}
                      className={`w-full h-48 object-cover rounded-lg border ${imageLoading ? 'hidden' : ''}`}
                      onError={(e) => {
                        console.error('Error loading image:', selectedFile.path);
                        setImageError('Error al cargar la imagen');
                        setImageLoading(false);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', selectedFile.path);
                        setImageLoading(false);
                        setImageError(null);
                      }}
                    />
                    
                    {imageError && (
                      <div className="w-full h-48 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                        <div className="text-center text-red-600">
                          <p className="font-medium">{imageError}</p>
                          <p className="text-sm mt-1">Ruta: {selectedFile.path}</p>
                          <p className="text-xs text-red-400 mt-2">
                            Verifica que la imagen existe en el servidor
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Nombre:</span> {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ruta:</span> 
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {selectedFile.path}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tipo:</span> {selectedFile.type}
                  </p>
                  {selectedFile.size && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Tamaño:</span> {selectedFile.size}
                    </p>
                  )}
                  {selectedFile.lastModified && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Última modificación:</span> {selectedFile.lastModified}
                    </p>
                  )}
                </div>
                
                <div className="flex space-x-2 flex-wrap gap-2">
                  {selectedFile.type === 'image' && (
                    <button
                      onClick={() => window.open(selectedFile.path, '_blank')}
                      className="px-3 py-2 text-sm text-green-600 hover:text-green-800 transition-colors"
                      title="Abrir en nueva pestaña"
                    >
                      🔗 Abrir
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedFile.path);
                      alert('URL copiada al portapapeles');
                    }}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    title="Copiar URL"
                  >
                    📋 Copiar URL
                  </button>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => handleDeleteFile(selectedFile)}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg font-medium">Sin archivo seleccionado</p>
                <p className="text-gray-400 text-sm mt-1">Selecciona un archivo de la lista para ver la vista previa</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modal de Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Subir Archivos</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Contenido
                </label>
                <select
                  id="uploadContentType"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="proyectos">Proyectos</option>
                  <option value="noticias">Noticias</option>
                  <option value="acerca">Acerca</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Carpeta
                </label>
                <input
                  type="text"
                  id="uploadFolderName"
                  placeholder="nombre-descriptivo"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se creará una carpeta con este nombre para organizar los archivos
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Archivos
                </label>
                <input
                  type="file"
                  id="uploadFiles"
                  multiple
                  accept="image/*"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puedes seleccionar múltiples imágenes. Máximo 5MB por archivo.
                </p>
              </div>
              
              {/* Indicador de progreso */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subiendo archivos...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
                              <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                  const contentType = (document.getElementById('uploadContentType') as HTMLSelectElement).value;
                  const folderName = (document.getElementById('uploadFolderName') as HTMLInputElement).value;
                  const files = (document.getElementById('uploadFiles') as HTMLInputElement).files;
                  
                  if (!folderName.trim()) {
                    alert('Por favor ingresa un nombre para la carpeta');
                    return;
                  }
                  
                  if (!files || files.length === 0) {
                    alert('Por favor selecciona al menos un archivo');
                    return;
                  }
                  
                  setUploading(true);
                  setUploadProgress(0);
                  
                  try {
                    // Subir cada archivo
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      const formData = new FormData();
                      formData.append('image', file);
                      formData.append('projectId', folderName);
                      formData.append('contentType', contentType);
                      
                      const response = await fetch('/api/upload-image', {
                        method: 'POST',
                        body: formData
                      });
                      
                      if (!response.ok) {
                        throw new Error(`Error al subir ${file.name}`);
                      }
                      
                      // Actualizar progreso
                      setUploadProgress(((i + 1) / files.length) * 100);
                    }
                    
                    alert(`${files.length} archivo(s) subido(s) exitosamente a ${contentType}/${folderName}`);
                    setShowUploadModal(false);
                    setUploading(false);
                    setUploadProgress(0);
                    loadMediaStructure(); // Recargar la estructura
                  } catch (error) {
                    alert('Error al subir archivos: ' + error.message);
                    setUploading(false);
                    setUploadProgress(0);
                  }
                }}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? 'Subiendo...' : 'Subir Archivos'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
