'use client';

import { useMemo } from 'react';

interface RichContentProps {
  content: string;
  className?: string;
}

export default function RichContent({ content, className = '' }: RichContentProps) {
  const processedContent = useMemo(() => {
    if (!content) {
      return '';
    }

    // Debug: Ver qué contenido estamos recibiendo (solo se ejecuta cuando content cambia)
    console.log('RichContent processing content:', content.substring(0, 200));

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
      /src="https:\/\/player\.vimeo\.com\/video\/(\d+)(?:\?[^"]*)?"/g,
      (match, videoId) => {
        // Parámetros optimizados para evitar pausa automática:
        // title=0, byline=0, portrait=0: Ocultar información del video
        // autopause=0: CRÍTICO - No pausar cuando el iframe pierde el foco
        // muted=0: No silenciar (permite reproducción normal)
        // loop=0: No repetir en bucle
        // controls=1: Mostrar controles del reproductor
        console.log(`Transforming Vimeo URL for video ID: ${videoId}`);
        return `src="https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&autopause=0&muted=0&loop=0&controls=1"`;
      }
    );

    // Asegurar que los iframes de Vimeo tengan los atributos necesarios
    processed = processed.replace(
      /<iframe([^>]*src="https:\/\/player\.vimeo\.com[^"]*")([^>]*)>/g,
      (match, srcPart, restPart) => {
        let newIframe = `<iframe${srcPart}`;

        // Agregar frameborder="0" si no existe (mejor compatibilidad)
        if (!restPart.includes('frameborder')) {
          newIframe += ' frameborder="0"';
        }

        // Agregar atributo allow (incluye fullscreen, evitando el warning de allowfullscreen)
        if (!restPart.includes('allow=')) {
          newIframe += ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"';
        }

        // Solo agregar allowfullscreen si NO tiene el atributo allow (para compatibilidad legacy)
        if (!restPart.includes('allow=') && !restPart.includes('allowfullscreen') && !restPart.includes('allowFullScreen')) {
          newIframe += ' allowfullscreen';
        }

        newIframe += restPart + '>';
        return newIframe;
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

    return processed;
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
