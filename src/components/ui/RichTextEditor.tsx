'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import HardBreak from '@tiptap/extension-hard-break';
import Youtube from '@tiptap/extension-youtube';
import { useState, useEffect, useRef, useCallback } from 'react';
import MediaSelector from './MediaSelector';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  label?: string;
  contentType?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  height = 300,
  label,
  contentType = 'content'
}: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [editorHeight, setEditorHeight] = useState(height);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const isUpdatingFromEditor = useRef(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Función para limpiar HTML antes de enviarlo
  const cleanHTML = (html: string): string => {
    return html
      // Eliminar párrafos vacíos duplicados consecutivos
      .replace(/(<p><\/p>\s*){2,}/g, '<p></p>')
      // Limpiar espacios al inicio y final del HTML
      .trim();
  };

  // Función para obtener el contenido limpio del editor
  const getCleanContent = (): string => {
    if (!editor) return '';
    return cleanHTML(editor.getHTML());
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle manual resize with drag
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = editorHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizeStartY.current;
      const newHeight = Math.max(200, Math.min(800, resizeStartHeight.current + deltaY));
      setEditorHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [editorHeight]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Desactivar link del StarterKit para usar nuestra configuración personalizada
        link: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'full-width-image',
          style: 'width: 100%; height: auto;',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        width: 640,
        height: 480,
      }),
    ],
    content: value ? cleanHTML(value) : '',
    onUpdate: ({ editor }) => {
      // Marcar que la actualización viene del editor
      isUpdatingFromEditor.current = true;

      // Obtener el HTML del editor y limpiarlo
      const html = cleanHTML(editor.getHTML());
      onChange(html);

      // Resetear el flag después de un breve delay
      setTimeout(() => {
        isUpdatingFromEditor.current = false;
      }, 0);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
        placeholder: placeholder,
        style: 'white-space: pre-wrap;',
      },
      handleKeyDown: (view, event) => {
        // Override Shift+Cmd+E / Ctrl+Shift+E para permitir cambio de idioma
        // Este shortcut no debe ser manejado por TipTap
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey && (event.key === 'e' || event.key === 'E')) {
          // No manejar este evento - dejar que lo maneje el componente padre
          return false;
        }
        // Permitir que Enter funcione naturalmente
        return false;
      },
      handlePaste: (view, event) => {
        if (!editor) return false;

        const html = event.clipboardData?.getData('text/html');
        const text = event.clipboardData?.getData('text/plain');

        // Check for YouTube URL
        if (text && (text.includes('youtube.com') || text.includes('youtu.be'))) {
          event.preventDefault();
          editor.commands.setYoutubeVideo({ src: text });
          return true;
        }

        // Check for Vimeo URL and insert as iframe HTML
        if (text && text.includes('vimeo.com')) {
          event.preventDefault();
          const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
          const match = text.match(vimeoRegex);
          if (match) {
            const videoId = match[1];
            // Agregar parámetros para ocultar título, autor y controles mínimos
            const embedUrl = `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`;
            const iframeHtml = `<div class="video-wrapper"><iframe src="${embedUrl}" width="1280" height="720" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
            editor.commands.insertContent(iframeHtml);
            return true;
          }
        }

        // Si hay HTML, dejar que TipTap lo maneje
        if (html && html.trim()) {
          return false;
        }

        // Si hay texto plano con múltiples párrafos
        if (text) {
          const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

          if (paragraphs.length > 1) {
            event.preventDefault();

            // Convertir a HTML con párrafos
            const htmlContent = paragraphs
              .map(para => {
                // Reemplazar saltos simples con <br>
                const withBreaks = para.trim().replace(/\n/g, '<br>');
                return `<p>${withBreaks}</p>`;
              })
              .join('');

            // Insertar el HTML
            editor.commands.insertContent(htmlContent);
            return true;
          }
        }

        return false;
      },
    },
    immediatelyRender: false,
    autofocus: false, // Desactivar autofocus automático
  });

  // REMOVIDO: El useEffect de auto-focus causaba que el cursor saltara al final
  // TipTap maneja el focus naturalmente cuando el usuario hace clic

  // Limpiar contenido cuando cambie el valor desde las props
  // SOLO si el cambio NO viene del editor mismo (evita loops y saltos de cursor)
  useEffect(() => {
    if (editor && !isUpdatingFromEditor.current) {
      const cleanValue = cleanHTML(value || '');
      const currentContent = editor.getHTML();

      // Solo actualizar si hay un cambio REAL
      if (cleanValue !== currentContent) {
        // Si el editor no tiene foco o el contenido está vacío, actualizar
        if (!editor.isFocused || currentContent === '<p></p>' || currentContent === '') {
          editor.commands.setContent(cleanValue, false); // false = no emitir update event
        }
      }
    }
  }, [value, editor]);

  // Escuchar evento de cambio de idioma para actualizar el contenido
  useEffect(() => {
    const handleLanguageChange = () => {
      // Cuando cambia el idioma, el editor pierde el foco automáticamente
      // Esto permite que el contenido se actualice con el nuevo idioma
      if (editor) {
        editor.commands.blur();
      }
    };

    window.addEventListener('editingLanguageChanged', handleLanguageChange);
    return () => window.removeEventListener('editingLanguageChanged', handleLanguageChange);
  }, [editor]);

  if (!isClient || !editor) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="h-64 bg-gray-100 animate-pulse rounded-md"></div>
      </div>
    );
  }

  const addLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.prompt('URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMediaSelector(true);
  };

  const handleMediaSelect = (imageUrl: string) => {
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setShowMediaSelector(false);
  };

  const addVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.prompt('URL del video (YouTube o Vimeo):');
    if (url) {
      if (url.includes('vimeo.com')) {
        const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
        const match = url.match(vimeoRegex);
        if (match) {
          const videoId = match[1];
          // Usar los mismos parámetros para ocultar título y autor
          const embedUrl = `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479`;
          const iframeHtml = `<div class="video-wrapper"><iframe src="${embedUrl}" width="1280" height="720" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
          editor.commands.insertContent(iframeHtml);
        }
      } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
        editor.commands.setYoutubeVideo({ src: url });
      }
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* CSS para los párrafos y elementos dentro del editor */}
      <style jsx global>{`
        .ProseMirror p {
          margin-bottom: 1em;
        }
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        .ProseMirror img {
          width: 100%; /* Ancho completo */
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
          display: block;
        }
        .ProseMirror .video-wrapper {
          position: relative;
          max-width: 1200px; /* Aumentar ancho máximo para videos más grandes */
          margin: 2rem auto; /* Centrar el video */
        }
        .ProseMirror .video-wrapper::before {
          content: '';
          display: block;
          padding-top: 56.25%; /* 16:9 aspect ratio */
        }
        .ProseMirror .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 8px;
          background: #f3f4f6;
        }
        .ProseMirror div[data-youtube-video] {
          position: relative;
          max-width: 1200px; /* Aumentar ancho máximo para consistencia */
          margin: 2rem auto;
        }
        .ProseMirror div[data-youtube-video]::before {
          content: '';
          display: block;
          padding-top: 56.25%;
        }
        .ProseMirror div[data-youtube-video] iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }
        .resize-handle {
          cursor: ns-resize;
        }
        .resize-handle:hover {
          background-color: #374151;
        }
      `}</style>

      {/* Toolbar */}
      <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text formatting */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
          title="Negrita"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          title="Cursiva"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
          title="Subrayado"
        >
          <u>U</u>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
          title="Título 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
          title="Título 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
          title="Título 3"
        >
          H3
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          title="Lista con viñetas"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          title="Lista numerada"
        >
          1.
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* Alignment */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
          title="Alinear izquierda"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4h16v2H2V4zm0 4h10v2H2V8zm0 4h16v2H2v-2zm0 4h10v2H2v-2z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
          title="Centrar"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4h16v2H2V4zm3 4h10v2H5V8zm-3 4h16v2H2v-2zm3 4h10v2H5v-2z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
          title="Alinear derecha"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4h16v2H2V4zm6 4h10v2H8V8zm-6 4h16v2H2v-2zm6 4h10v2H8v-2z"/>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''}`}
          title="Justificar"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 4h16v2H2V4zm0 4h16v2H2V8zm0 4h16v2H2v-2zm0 4h16v2H2v-2z"/>
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* Links, images and videos */}
        <button
          type="button"
          onClick={addLink}
          onMouseDown={(e) => e.preventDefault()}
          className="p-2 rounded hover:bg-gray-200"
          title="Agregar enlace"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={addImage}
          onMouseDown={(e) => e.preventDefault()}
          className="p-2 rounded hover:bg-gray-200"
          title="Agregar imagen desde Cloudinary"
        >
          🖼️
        </button>
        <button
          type="button"
          onClick={addVideo}
          onMouseDown={(e) => e.preventDefault()}
          className="p-2 rounded hover:bg-gray-200"
          title="Agregar video (YouTube/Vimeo)"
        >
          🎬
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* Clear formatting */}
        <button
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-2 rounded hover:bg-gray-200"
          title="Limpiar formato"
        >
          🧹
        </button>
        
        {/* Clean HTML button */}
        <button
          onClick={() => {
            if (editor) {
              const cleanContent = getCleanContent();
              editor.commands.setContent(cleanContent);
              editor.commands.focus('end');
            }
          }}
          className="p-2 rounded hover:bg-gray-200"
          title="Limpiar HTML y espacios"
        >
          🧽
        </button>
      </div>
      
      {/* Editor content */}
      <div className="bg-white border border-t-0 border-gray-300 rounded-b-md relative overflow-hidden" style={{ height: editorHeight }}>
        <EditorContent
          editor={editor}
          className="h-full overflow-y-auto focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
          style={{ cursor: 'text', paddingBottom: '10px' }}
        />

        {/* Resize handle - bottom border */}
        <div
          onMouseDown={handleResizeStart}
          className={`absolute bottom-0 left-0 right-0 h-2 bg-gray-500 hover:bg-gray-600 cursor-ns-resize transition-colors ${
            isResizing ? 'bg-gray-700' : ''
          }`}
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
            backgroundPosition: 'center',
          }}
          title="Arrastra para redimensionar"
        />
      </div>
      
      {/* Instrucciones */}
      <div className="mt-2 text-xs text-gray-500">
        <p>
          💡 <strong>Consejo:</strong> Presiona Enter para crear nuevos párrafos.
          <span className="ml-1">🖼️ Puedes insertar imágenes desde Cloudinary.</span>
          <span className="ml-1">🎬 Pega URLs de YouTube o Vimeo para insertar videos.</span>
          <span className="ml-1">↕️ Arrastra el borde inferior para redimensionar.</span>
        </p>
      </div>

      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={handleMediaSelect}
        title="Seleccionar imagen desde Cloudinary"
        contentType={contentType}
      />
    </div>
  );
}
