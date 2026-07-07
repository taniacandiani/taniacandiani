'use client';

import { useMemo, memo } from 'react';

interface RichContentProps {
  content: string;
  className?: string;
}

// Componente estable para iframes de Vimeo - no se destruye en re-renders
const VimeoEmbed = memo(function VimeoEmbed({ videoId }: { videoId: string }) {
  return (
    <div style={{ position: 'relative', maxWidth: '1200px', margin: '2rem auto', paddingTop: '56.25%' }}>
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&autopause=0&muted=0&loop=0&controls=1`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', borderRadius: '8px', background: '#f3f4f6' }}
      />
    </div>
  );
});

// Marcador usado para separar contenido HTML de los embeds de Vimeo
const VIMEO_PLACEHOLDER = '___VIMEO_EMBED___';

interface ContentPart {
  type: 'html' | 'vimeo';
  value: string; // HTML string o video ID
}

function RichContent({ content, className = '' }: RichContentProps) {
  const parts = useMemo((): ContentPart[] => {
    if (!content) {
      return [];
    }

    // Decodificar entidades HTML si el contenido está escapado
    const decodeHTMLEntities = (text: string): string => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    };

    let processed = content;
    if (content.includes('&lt;') || content.includes('&gt;') || content.includes('&quot;')) {
      processed = decodeHTMLEntities(content);
    }

    // Extraer iframes de Vimeo (con o sin wrapper) y reemplazar con placeholders
    const vimeoIds: string[] = [];
    // Primero: capturar wrapper + iframe juntos
    processed = processed.replace(
      /<div[^>]*class="video-wrapper"[^>]*>\s*<iframe[^>]*src="https:\/\/player\.vimeo\.com\/video\/(\d+)(?:\?[^"]*)?\"[^>]*>(?:<\/iframe>)?\s*<\/div>/gi,
      (_match, videoId) => {
        vimeoIds.push(videoId);
        return VIMEO_PLACEHOLDER;
      }
    );
    // Segundo: capturar iframes sueltos (sin wrapper)
    processed = processed.replace(
      /<iframe[^>]*src="https:\/\/player\.vimeo\.com\/video\/(\d+)(?:\?[^"]*)?\"[^>]*>(?:<\/iframe>)?/gi,
      (_match, videoId) => {
        vimeoIds.push(videoId);
        return VIMEO_PLACEHOLDER;
      }
    );
    // Limpiar wrappers vacíos residuales
    processed = processed.replace(/<div[^>]*class="video-wrapper"[^>]*>\s*<\/div>/gi, '');

    // También capturar enlaces directos de Vimeo que no sean iframes (por si hay solo URLs)
    processed = processed.replace(
      /(?:<p[^>]*>)?\s*https:\/\/(?:www\.)?vimeo\.com\/(\d+)\s*(?:<\/p>)?/gi,
      (_match, videoId) => {
        vimeoIds.push(videoId);
        return VIMEO_PLACEHOLDER;
      }
    );

    // Procesar formato del HTML restante (sin iframes de Vimeo)
    if (!processed.includes('<p>') && !processed.includes('<div') && !processed.includes('<iframe') && !processed.includes('<br') && !processed.includes(VIMEO_PLACEHOLDER)) {
      const paragraphs = processed.split(/\n\s*\n/).filter(p => p.trim());
      if (paragraphs.length > 1) {
        processed = paragraphs.map(p => `<p class="paragraph">${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
      } else {
        processed = `<p class="paragraph">${processed.replace(/\n/g, '<br>')}</p>`;
      }
    } else {
      processed = processed.replace(/<br\s*\/?>/gi, '<br class="line-break">');
      processed = processed.replace(/<p>/gi, '<p class="paragraph">');
      processed = processed.replace(/(<br\s*\/?>\s*){2,}/gi, '</p><p class="paragraph">');
      if (!processed.includes('<p>') && !processed.includes('<div') && !processed.includes('<iframe') && !processed.includes(VIMEO_PLACEHOLDER)) {
        processed = `<p class="paragraph">${processed}</p>`;
      }
    }

    // Asegurar que iframes no-Vimeo tengan atributos necesarios
    processed = processed.replace(
      /<iframe([^>]*src="https:\/\/player\.vimeo\.com[^"]*")([^>]*)>/g,
      (match, srcPart, restPart) => {
        let newIframe = `<iframe${srcPart}`;
        if (!restPart.includes('frameborder')) newIframe += ' frameborder="0"';
        if (!restPart.includes('allow=')) newIframe += ' allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"';
        newIframe += restPart + '>';
        return newIframe;
      }
    );

    // Dividir el contenido en partes: HTML y embeds de Vimeo
    const segments = processed.split(VIMEO_PLACEHOLDER);
    const result: ContentPart[] = [];
    let vimeoIndex = 0;

    for (let i = 0; i < segments.length; i++) {
      const html = segments[i].trim();
      if (html) {
        result.push({ type: 'html', value: html });
      }
      if (i < segments.length - 1 && vimeoIndex < vimeoIds.length) {
        result.push({ type: 'vimeo', value: vimeoIds[vimeoIndex] });
        vimeoIndex++;
      }
    }

    return result;
  }, [content]);

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className={`rich-content ${className}`}>
      {parts.map((part, i) =>
        part.type === 'vimeo' ? (
          <VimeoEmbed key={`vimeo-${part.value}`} videoId={part.value} />
        ) : (
          <div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: part.value }} />
        )
      )}
    </div>
  );
}

export default memo(RichContent);
