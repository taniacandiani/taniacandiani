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

    // Debug: Ver qué contenido estamos recibiendo
    console.log('RichContent received content:', content.substring(0, 200));

    // Decodificar entidades HTML si el contenido está escapado
    const decodeHTMLEntities = (text: string): string => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    };

    // Si el contenido contiene entidades HTML escapadas, decodificarlas
    let processed = content;
    if (content.includes('&lt;') || content.includes('&gt;') || content.includes('&quot;')) {
      processed = decodeHTMLEntities(content);
      console.log('Content was HTML-encoded, decoded to:', processed.substring(0, 200));
    }

    // Actualizar URLs de Vimeo para agregar/corregir parámetros
    // Reemplazar TODAS las URLs de Vimeo con los parámetros correctos
    processed = processed.replace(
      /https:\/\/player\.vimeo\.com\/video\/(\d+)(?:\?[^"]*)?"?/g,
      (match, videoId) => {
        // Siempre usar los parámetros correctos, sin importar lo que tenía antes
        // autoplay=0: No reproducir automáticamente
        // autopause=0: No pausar cuando se pierde el foco
        // background=0: Permitir controles normales
        // Eliminamos player_id y app_id que causan problemas
        return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&autoplay=0&background=0"`;
      }
    );

    // Asegurar que los iframes de Vimeo tengan los atributos allow necesarios
    processed = processed.replace(
      /<iframe([^>]*src="https:\/\/player\.vimeo\.com[^"]*")([^>]*)>/g,
      (match, srcPart, restPart) => {
        // Si ya tiene el atributo allow, no modificar
        if (restPart.includes('allow=')) {
          return match;
        }
        // Agregar atributo allow para permitir autoplay, fullscreen, etc.
        return `<iframe${srcPart} allow="autoplay; fullscreen; picture-in-picture; clipboard-write"${restPart}>`;
      }
    );

    // Mantener iframes y videos intactos (no modificar su HTML)
    // Esto preserva los iframes de Vimeo y YouTube

    // Si el texto no tiene tags HTML, convertir saltos de línea en párrafos
    if (!processed.includes('<p>') && !processed.includes('<div') && !processed.includes('<iframe') && !processed.includes('<br')) {
      // Convertir saltos de línea dobles en separadores de párrafo
      const paragraphs = processed.split(/\n\s*\n/).filter(p => p.trim());
      if (paragraphs.length > 1) {
        processed = paragraphs.map(p => `<p class="paragraph">${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
      } else {
        // Si solo hay un párrafo, convertir saltos simples en <br>
        processed = `<p class="paragraph">${processed.replace(/\n/g, '<br>')}</p>`;
      }
    } else {
      // Convertir saltos de línea simples en espaciado visual (solo fuera de iframes)
      processed = processed.replace(/<br\s*\/?>/gi, '<br class="line-break">');

      // Asegurar que los párrafos tengan espaciado consistente
      processed = processed.replace(/<p>/gi, '<p class="paragraph">');

      // Convertir múltiples saltos de línea consecutivos en párrafos separados
      processed = processed.replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p class="paragraph">');

      // Envolver en un párrafo si no hay tags de párrafo (y no es un iframe directo)
      if (!processed.includes('<p>') && !processed.includes('<div') && !processed.includes('<iframe')) {
        processed = `<p class="paragraph">${processed}</p>`;
      }
    }

    setProcessedContent(processed);
  }, [content]);

  if (!processedContent) {
    return null;
  }

  return (
    <>
      {/* CSS para videos responsivos */}
      <style jsx global>{`
        .rich-content .video-wrapper {
          position: relative;
          max-width: 1200px; /* Aumentar ancho máximo para videos más grandes */
          margin: 2rem auto; /* Centrar el video */
        }

        .rich-content .video-wrapper::before {
          content: '';
          display: block;
          padding-top: 56.25%; /* 16:9 aspect ratio */
        }

        .rich-content .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 8px;
          background: #f3f4f6;
        }

        /* YouTube embeds from TipTap */
        .rich-content div[data-youtube-video] {
          position: relative;
          max-width: 1200px; /* Aumentar ancho máximo para consistencia */
          margin: 2rem auto; /* Centrar el video */
          padding-bottom: 0;
          height: auto;
          overflow: hidden;
          border-radius: 8px;
        }

        .rich-content div[data-youtube-video]::before {
          content: '';
          display: block;
          padding-top: 56.25%; /* 16:9 aspect ratio */
        }

        .rich-content div[data-youtube-video] iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 8px;
        }

        /* Images - Full Width */
        .rich-content img {
          width: 100%; /* Ancho completo */
          height: auto;
          border-radius: 8px;
          margin: 2rem 0;
          display: block;
          object-fit: cover;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .rich-content .video-wrapper,
          .rich-content div[data-youtube-video] {
            max-width: 100%;
          }
        }

        /* Paragraphs and text */
        .rich-content .paragraph {
          margin-bottom: 1em;
        }

        .rich-content .line-break {
          display: block;
          height: 0.5em;
        }

        .rich-content p:last-child {
          margin-bottom: 0;
        }

        /* Lists */
        .rich-content ul,
        .rich-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        .rich-content li {
          margin: 0.5em 0;
        }

        /* Links */
        .rich-content a {
          color: #2563eb;
          text-decoration: underline;
          transition: color 0.2s;
        }

        .rich-content a:hover {
          color: #1d4ed8;
        }

        /* Headings */
        .rich-content h1,
        .rich-content h2,
        .rich-content h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }

        .rich-content h1 {
          font-size: 2em;
        }

        .rich-content h2 {
          font-size: 1.5em;
        }

        .rich-content h3 {
          font-size: 1.25em;
        }
      `}</style>

      <div
        className={`rich-content ${className}`}
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    </>
  );
}
