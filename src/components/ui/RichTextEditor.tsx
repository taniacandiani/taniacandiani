'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import HardBreak from '@tiptap/extension-hard-break';
import { useState, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  label?: string;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Escribe aquí...',
  height = 300,
  label
}: RichTextEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [currentHeight, setCurrentHeight] = useState(height);

  // Función para limpiar HTML antes de enviarlo
  const cleanHTML = (html: string): string => {
    return html
      // Eliminar párrafos vacíos
      .replace(/<p><\/p>/g, '')
      .replace(/<p>\s*<\/p>/g, '')
      // Eliminar &nbsp; y espacios en blanco innecesarios
      .replace(/&nbsp;/g, ' ')
      // Limpiar espacios múltiples
      .replace(/\s+/g, ' ')
      // Limpiar espacios al inicio y final de párrafos
      .replace(/<p>\s+/g, '<p>')
      .replace(/\s+<\/p>/g, '</p>')
      // Limpiar espacios al inicio y final del HTML
      .trim();
  };

  // Función para obtener el contenido limpio del editor
  const getCleanContent = (): string => {
    if (!editor) return '';
    return cleanHTML(editor.getHTML());
  };

  // Predefined height options
  const heightOptions = [
    { value: 200, label: 'Pequeño' },
    { value: 300, label: 'Mediano' },
    { value: 400, label: 'Grande' },
    { value: 500, label: 'Extra Grande' },
    { value: 600, label: 'Muy Grande' }
  ];

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleHeightChange = (newHeight: number) => {
    setCurrentHeight(newHeight);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'mb-0',
          },
        },
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
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      HardBreak.configure({
        HTMLAttributes: {
          class: 'my-2',
        },
      }),
    ],
    content: value ? cleanHTML(value) : '',
    onUpdate: ({ editor }) => {
      // Obtener el HTML del editor y limpiarlo
      const html = cleanHTML(editor.getHTML());
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
        placeholder: placeholder,
      },
      handleKeyDown: (view, event) => {
        // Permitir que Enter funcione naturalmente
        return false;
      },
      handlePaste: (view, event) => {
        // Limpiar contenido pegado para evitar caracteres problemáticos
        event.preventDefault();
        const text = event.clipboardData?.getData('text/plain') || '';
        const cleanText = cleanHTML(text);
        view.dispatch(view.state.tr.insertText(cleanText));
        return true;
      },
    },
    immediatelyRender: false,
    autofocus: false, // Desactivar autofocus automático
  });

  // Enfocar el editor cuando esté listo y tenga contenido
  useEffect(() => {
    if (editor && isClient) {
      // Pequeño delay para asegurar que el editor esté completamente montado
      const timer = setTimeout(() => {
        if (editor.isDestroyed) return;
        
        // Enfocar el editor y mover el cursor al final del contenido
        editor.commands.focus('end');
        
        // Si no hay contenido, crear un párrafo vacío para mejor UX
        if (!editor.getHTML() || editor.getHTML() === '<p></p>') {
          editor.commands.setContent('<p><br></p>');
          editor.commands.focus('end');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [editor, isClient]);

  // Limpiar contenido cuando cambie el valor desde las props
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const cleanValue = cleanHTML(value || '');
      if (cleanValue !== editor.getHTML()) {
        editor.commands.setContent(cleanValue);
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

  const addLink = () => {
    const url = window.prompt('URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Toolbar */}
      <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text formatting */}
        <button
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
          ⬅
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
          title="Centrar"
        >
          ↔
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
          title="Alinear derecha"
        >
          ➡
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        {/* Links and images */}
        <button
          onClick={addLink}
          className="p-2 rounded hover:bg-gray-200"
          title="Agregar enlace"
        >
          🔗
        </button>
        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200"
          title="Agregar imagen"
        >
          🖼️
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
      <div className="border border-t-0 border-gray-300 rounded-b-md relative" style={{ height: currentHeight }}>
        <EditorContent 
          editor={editor} 
          className="h-full overflow-y-auto focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
          tabIndex={0}
          onClick={() => {
            // Asegurar que el editor se enfoque cuando se hace clic en el área de contenido
            if (editor && !editor.isDestroyed) {
              editor.commands.focus('end');
            }
          }}
          onKeyDown={(e) => {
            // Si se presiona Tab, enfocar el editor
            if (e.key === 'Tab') {
              e.preventDefault();
              if (editor && !editor.isDestroyed) {
                editor.commands.focus('end');
              }
            }
          }}
        />
        
        {/* Resize button - bottom right corner */}
        <div className="absolute bottom-2 right-2">
          <div className="relative group">
            <button
              type="button"
              className="bg-gray-600 hover:bg-gray-700 text-white rounded-md p-2 transition-colors duration-200 shadow-lg"
              title="Cambiar tamaño del editor"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[120px]">
              <div className="py-1">
                {heightOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleHeightChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      currentHeight === option.value ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {option.label} ({option.value}px)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Instrucciones */}
      <div className="mt-2 text-xs text-gray-500">
        <p>💡 <strong>Consejo:</strong> Presiona Enter para crear nuevos párrafos. Usa la barra de herramientas para formato adicional. 
        <span className="ml-1">📏 <strong>Redimensionar:</strong> Usa el botón de la esquina inferior derecha para cambiar el tamaño del editor.</span></p>
      </div>
    </div>
  );
}
