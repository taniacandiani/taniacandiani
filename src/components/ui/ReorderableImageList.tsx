'use client';

import { useState, useRef, DragEvent } from 'react';

interface ReorderableImageListProps {
  images: string[];
  descriptions?: string[];
  descriptionsEn?: string[];
  editingLanguage: 'es' | 'en';
  onReorder: (newImages: string[], newDescriptions?: string[], newDescriptionsEn?: string[]) => void;
  onRemove: (index: number) => void;
  onDescriptionChange: (index: number, value: string, language: 'es' | 'en') => void;
}

export default function ReorderableImageList({
  images,
  descriptions = [],
  descriptionsEn = [],
  editingLanguage,
  onReorder,
  onRemove,
  onDescriptionChange,
}: ReorderableImageListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight transparency to the dragged element
    const target = e.currentTarget as HTMLDivElement;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement;
    target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    dragCounter.current = 0;

    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    // Create new arrays with the reordered items
    const newImages = [...images];
    const newDescriptions = [...descriptions];
    const newDescriptionsEn = [...descriptionsEn];

    // Remove the dragged item and insert it at the drop position
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    const [draggedDesc] = newDescriptions.splice(draggedIndex, 1);
    const [draggedDescEn] = newDescriptionsEn.splice(draggedIndex, 1);

    newImages.splice(dropIndex, 0, draggedImage);
    newDescriptions.splice(dropIndex, 0, draggedDesc || '');
    newDescriptionsEn.splice(dropIndex, 0, draggedDescEn || '');

    // Call the onReorder callback with the new order
    onReorder(newImages, newDescriptions, newDescriptionsEn);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const validImages = images.filter(img => img && img.trim() !== '');

  if (validImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {validImages.map((image, index) => {
        const originalIndex = images.indexOf(image);
        const isDragging = draggedIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={`${image}-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              flex items-start gap-4 p-3 border rounded transition-all
              ${isDragging ? 'opacity-50' : ''}
              ${isDragOver ? 'border-black bg-gray-50' : 'border-gray-200'}
              cursor-move hover:border-gray-400
            `}
            style={{
              transform: isDragOver && draggedIndex !== null && draggedIndex !== index
                ? draggedIndex < index ? 'translateY(-4px)' : 'translateY(4px)'
                : 'translateY(0)',
              transition: 'transform 0.2s'
            }}
          >
            {/* Drag Handle Icon */}
            <div className="flex flex-col justify-center h-24 text-gray-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>

            {/* Image Preview */}
            <div className="relative">
              <img
                src={image}
                alt={`Hero ${index + 1}`}
                className="w-24 h-24 object-cover rounded"
              />
              {index === 0 && (
                <div className="absolute -top-2 -left-2 bg-black text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </div>

            {/* Description Field */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {editingLanguage === 'es'
                  ? `Descripción imagen ${index + 1} (opcional)`
                  : `Image ${index + 1} description (optional)`}
              </label>
              <textarea
                value={
                  editingLanguage === 'es'
                    ? (descriptions[originalIndex] || '')
                    : (descriptionsEn[originalIndex] || '')
                }
                onChange={(e) => onDescriptionChange(originalIndex, e.target.value, editingLanguage)}
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-black"
                placeholder={editingLanguage === 'es'
                  ? 'Descripción de la imagen...'
                  : 'Image description...'}
                onClick={(e) => e.stopPropagation()} // Prevent drag when clicking textarea
              />
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => onRemove(originalIndex)}
              className="text-red-500 hover:text-red-700 mt-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      {validImages.length > 1 && (
        <div className="text-xs text-gray-500 italic mt-2">
          Arrastra las imágenes para reorganizarlas. La primera imagen será la imagen principal.
        </div>
      )}
    </div>
  );
}