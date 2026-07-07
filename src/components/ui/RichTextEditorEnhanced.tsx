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
import Iframe from '@tiptap/extension-iframe';
import { useState, useEffect, useRef, useCallback } from 'react';
import MediaSelector from './MediaSelector';
import ImageUploader from './ImageUploader';

interface RichTextEditorEnhancedProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  label?: string;
  projectId?: string;
  contentType?: string;
}

// Custom Vimeo extension
const Vimeo = Iframe.extend({
  name: 'vimeo',

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
      },
      height: {
        default: '400',
      },
      frameborder: {
        default: '0',
      },
      allow: {
        default: 'autoplay; fullscreen; picture-in-picture',
      },
      allowfullscreen: {
        default: true,
      },
    }
  },
});

// Custom resizable image extension
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: attributes => {
          return {
            width: attributes.width,
          }
        },
      },
      height: {
        default: null,
        renderHTML: attributes => {
          return {
            height: attributes.height,
          }
        },
      },
      style: {
        default: null,
        renderHTML: attributes => {
          return {
            style: attributes.style,
          }
        },
      },
    }
  },
});

export default function RichTextEditorEnhanced({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  height = 300,
  label,
  projectId = 'general',
  contentType = 'content'
}: RichTextEditorEnhancedProps) {
  const [isClient, setIsClient] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [editorHeight, setEditorHeight] = useState(height);
  const isUpdatingFromEditor = useRef(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Función para limpiar HTML antes de enviarlo
  const cleanHTML = (html: string): string => {
    return html
      .replace(/(<p><\/p>\s*){2,}/g, '<p></p>')
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
        link: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      ResizableImage.configure({
        HTMLAttributes: {
          class: 'resizable-image',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Vimeo,
    ],
    content: value ? cleanHTML(value) : '',
    onUpdate: ({ editor }) => {
      isUpdatingFromEditor.current = true;
      const html = cleanHTML(editor.getHTML());
      onChange(html);
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
        // Enter inserta un salto de línea simple (<br>) en lugar de un párrafo
        // nuevo, para que el texto baje una sola línea (sin necesidad de
        // Shift+Enter). En listas, encabezados y bloques de código se conserva
        // el comportamiento normal de Enter.
        if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
          const { state } = view;
          const { $from } = state.selection;

          if ($from.parent.type.name !== 'paragraph') {
            return false;
          }

          for (let depth = $from.depth; depth > 0; depth--) {
            if ($from.node(depth).type.name === 'listItem') {
              return false;
            }
          }

          const hardBreak = state.schema.nodes.hardBreak;
          if (hardBreak) {
            view.dispatch(state.tr.replaceSelectionWith(hardBreak.create()).scrollIntoView());
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        if (!editor) return false;

        const html = event.clipboardData?.getData('text/html');
        const text = event.clipboardData?.getData('text/plain');

        // Check for Vimeo URL
        if (text && text.includes('vimeo.com')) {
          event.preventDefault();
          const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
          const match = text.match(vimeoRegex);
          if (match) {
            const videoId = match[1];
            const embedUrl = `https://player.vimeo.com/video/${videoId}`;
            editor.chain().focus().setIframe({ src: embedUrl }).run();
            return true;
          }
        }

        // Check for YouTube URL
        if (text && (text.includes('youtube.com') || text.includes('youtu.be'))) {
          event.preventDefault();
          editor.commands.setYoutubeVideo({ src: text });
          return true;
        }

        // Handle HTML paste
        if (html && html.trim()) {
          return false;
        }

        // Handle plain text with paragraphs
        if (text) {
          const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
          if (paragraphs.length > 1) {
            event.preventDefault();
            const htmlContent = paragraphs
              .map(para => {
                const withBreaks = para.trim().replace(/\n/g, '<br>');
                return `<p>${withBreaks}</p>`;
              })
              .join('');
            editor.commands.insertContent(htmlContent);
            return true;
          }
        }

        return false;
      },
    },
    immediatelyRender: false,
    autofocus: false,
  });

  useEffect(() => {
    if (editor && !isUpdatingFromEditor.current && value !== editor.getHTML()) {
      const cleanValue = cleanHTML(value || '');
      const currentContent = editor.getHTML();
      if (cleanValue !== currentContent && !editor.isFocused) {
        editor.commands.setContent(cleanValue, false);
      }
    }
  }, [value, editor]);

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

  const handleImageUpload = (imageUrl: string) => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setShowImageUploader(false);
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
          const embedUrl = `https://player.vimeo.com/video/${videoId}`;
          editor.chain().focus().setIframe({ src: embedUrl }).run();
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

      {/* CSS para estilos del editor */}
      <style jsx global>{`
        .ProseMirror p {
          margin-bottom: 1em;
        }
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        .ProseMirror img.resizable-image {
          max-width: 100%;
          height: auto;
          cursor: move;
        }
        .ProseMirror iframe {
          width: 100%;
          max-width: 100%;
          border-radius: 8px;
          margin: 1em 0;
        }
        .resize-handle {
          cursor: ns-resize;
        }
        .resize-handle:hover {
          background-color: #374151;
        }
        .resize-handle:active {
          background-color: #1f2937;
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
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          title="Cursiva"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
          title="Subrayado"
        >
          <u>U</u>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Headings */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
          title="Título 1"
        >
          H1
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
          title="Título 2"
        >
          H2
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
          title="Título 3"
        >
          H3
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          title="Lista con viñetas"
        >
          •
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          title="Lista numerada"
        >
          1.
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Alignment */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
          title="Alinear izquierda"
        >
          ⬅
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
          title="Centrar"
        >
          ↔
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
          title="Alinear derecha"
        >
          ➡
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
          className="p-2 rounded hover:bg-gray-200 relative"
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
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="p-2 rounded hover:bg-gray-200"
          title="Limpiar formato"
        >
          🧹
        </button>

        {/* Clean HTML button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
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
      <div
        ref={editorContainerRef}
        className="bg-white border border-t-0 border-gray-300 rounded-b-md relative overflow-hidden"
        style={{ height: editorHeight }}
      >
        <EditorContent
          editor={editor}
          className="h-full overflow-y-auto focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
          style={{ cursor: 'text' }}
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

      {/* Image Uploader Modal */}
      {showImageUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Subir nueva imagen</h2>
              <button
                type="button"
                onClick={() => setShowImageUploader(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <ImageUploader
              onImageUpload={handleImageUpload}
              projectId={projectId}
              label=""
              contentType={contentType}
            />
          </div>
        </div>
      )}
    </div>
  );
}