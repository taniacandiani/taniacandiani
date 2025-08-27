'use client';

import { useState, useEffect } from 'react';
import { FiFolder, FiFile, FiImage, FiTrash2, FiEye, FiUpload, FiX } from 'react-icons/fi';

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

interface MediaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  currentImage?: string;
  title?: string;
  contentType?: string;
}

export default function MediaSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  currentImage,
  title = "Seleccionar Imagen",
  contentType = "proyectos"
}: MediaSelectorProps) {
  const [mediaStructure, setMediaStructure] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState('/uploads');
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMediaStructure();
    }
  }, [isOpen]);

  const loadMediaStructure = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/media');
      if (!response.ok) {
        throw new Error('Error al cargar la estructura de archivos');
      }
      
      const data = await response.json();
      setMediaStructure(data.structure || []);
    } catch (error) {
      console.error('Error loading media structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentFolder = (): MediaFolder | null => {
    if (currentPath === '/uploads') {
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

  const getFileIcon = (file: MediaFile) => {
    if (file.type === 'folder') return <FiFolder className="h-6 w-6 text-blue-500" />;
    if (file.type === 'image') return <FiImage className="h-6 w-6 text-green-500" />;
    return <FiFile className="h-6 w-6 text-gray-500" />;
  };

  const handleFileClick = (file: MediaFile) => {
    if (file.type === 'image') {
      setSelectedFile(file);
    }
  };

  const handleSelectImage = () => {
    if (selectedFile) {
      onSelect(selectedFile.path);
      onClose();
    }
  };

  const handleUpload = async () => {
    const folderName = (document.getElementById('uploadFolderName') as HTMLInputElement)?.value;
    const files = (document.getElementById('uploadFiles') as HTMLInputElement)?.files;
    
    if (!folderName?.trim()) {
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
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      alert(`${files.length} archivo(s) subido(s) exitosamente`);
      setShowUploadModal(false);
      setUploading(false);
      setUploadProgress(0);
      loadMediaStructure();
    } catch (error) {
      alert('Error al subir archivos: ' + error.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const filteredFiles = () => {
    const currentFolder = getCurrentFolder();
    if (!currentFolder) return [];
    
    let allFiles: MediaFile[] = [];
    
    // Recursivamente obtener todos los archivos
    const getAllFiles = (folder: MediaFolder): MediaFile[] => {
      let files = [...folder.files];
      folder.subfolders.forEach(subfolder => {
        files = files.concat(getAllFiles(subfolder));
      });
      return files;
    };
    
    if (currentPath === '/uploads') {
      mediaStructure.forEach(folder => {
        allFiles = allFiles.concat(getAllFiles(folder));
      });
    } else {
      allFiles = getAllFiles(currentFolder);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      allFiles = allFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.path.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return allFiles.filter(file => file.type === 'image');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Left Panel - Media Browser */}
          <div className="flex-1 p-6 border-r border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Explorar Media</h3>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex items-center space-x-2"
              >
                <FiUpload className="w-4 h-4" />
                <span>Upload</span>
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar imágenes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <button
                onClick={() => setCurrentPath('/uploads')}
                className="hover:text-gray-700 transition-colors"
              >
                Media
              </button>
              {currentPath !== '/uploads' && (
                <>
                  <span>/</span>
                  <button
                    onClick={() => {
                      const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/uploads';
                      setCurrentPath(parentPath);
                    }}
                    className="hover:text-gray-700 transition-colors"
                  >
                    {currentPath.split('/').pop()}
                  </button>
                </>
              )}
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando...</p>
                </div>
              ) : searchTerm ? (
                // Vista de búsqueda
                filteredFiles().map((file) => (
                  <div
                    key={file.path}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedFile?.path === file.path
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-center space-x-3">
                      <FiImage className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.path}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Vista normal de carpetas
                <>
                  {getCurrentFolder()?.subfolders?.map((folder) => (
                    <div
                      key={folder.path}
                      className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 border-blue-200 cursor-pointer transition-colors hover:bg-blue-100"
                      onClick={() => setCurrentPath(folder.path)}
                    >
                      <div className="flex items-center space-x-3">
                        <FiFolder className="h-6 w-6 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{folder.name}</p>
                          <p className="text-sm text-gray-500">{folder.path}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {getCurrentFolder()?.files?.filter(file => file.type === 'image').map((file) => (
                    <div
                      key={file.path}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFile?.path === file.path
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-center space-x-3">
                        <FiImage className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.path}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Preview and Selection */}
          <div className="w-80 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Vista Previa</h3>
            
            {selectedFile ? (
              <div className="space-y-4">
                <img
                  src={selectedFile.path}
                  alt={selectedFile.name}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Nombre:</span> {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ruta:</span> 
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded block mt-1">
                      {selectedFile.path}
                    </span>
                  </p>
                </div>
                
                <button
                  onClick={handleSelectImage}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Seleccionar Imagen
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FiImage className="mx-auto h-16 w-16" />
                </div>
                <p className="text-gray-500 text-lg font-medium">Sin imagen seleccionada</p>
                <p className="text-gray-400 text-sm mt-1">
                  Selecciona una imagen de la lista para ver la vista previa
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Subir Archivos</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
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
                </div>
                
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
                  onClick={handleUpload}
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
    </div>
  );
}
