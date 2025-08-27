'use client';

import { useEffect, useState } from 'react';

interface RichContentProps {
  content: string;
  className?: string;
}

export default function RichContent({ content, className = '' }: RichContentProps) {
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    if (!content) {
      setProcessedContent('');
      return;
    }

    // Procesar el HTML para mejorar la visualización
    let processed = content;
    
    // Convertir saltos de línea simples en espaciado visual
    processed = processed.replace(/<br\s*\/?>/gi, '<br class="line-break">');
    
    // Asegurar que los párrafos tengan espaciado consistente
    processed = processed.replace(/<p>/gi, '<p class="paragraph">');
    
    // Convertir múltiples saltos de línea consecutivos en párrafos separados
    processed = processed.replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p class="paragraph">');
    
    // Envolver en un párrafo si no hay tags de párrafo
    if (!processed.includes('<p>')) {
      processed = `<p class="paragraph">${processed}</p>`;
    }
    
    setProcessedContent(processed);
  }, [content]);

  if (!processedContent) {
    return null;
  }

  return (
    <div 
      className={`rich-content ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}
