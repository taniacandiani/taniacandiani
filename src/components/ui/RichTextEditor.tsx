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

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    content: value,
    onUpdate: ({ editor }) => {
      // Obtener el HTML del editor
      let html = editor.getHTML();
      
      // Limpiar HTML innecesario
      html = html.replace(/<p><\/p>/g, '');
      html = html.replace(/<p>\s*<\/p>/g, '');
      
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3',
        placeholder: placeholder,
      },
      handleKeyDown: (view, event) => {
        // Permitir que Enter funcione naturalmente
        return false;
      },
    },
    immediatelyRender: false,
  });

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
      </div>
      
      {/* Editor content */}
      <div className="border border-t-0 border-gray-300 rounded-b-md" style={{ height }}>
        <EditorContent 
          editor={editor} 
          className="min-h-full"
        />
      </div>
      
      {/* Instrucciones */}
      <div className="mt-2 text-xs text-gray-500">
        <p>💡 <strong>Consejo:</strong> Presiona Enter para crear nuevos párrafos. Usa la barra de herramientas para formato adicional.</p>
      </div>
    </div>
  );
}
