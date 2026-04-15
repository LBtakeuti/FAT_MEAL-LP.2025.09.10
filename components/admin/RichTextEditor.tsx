'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('リンクURLを入力', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank', rel: 'noopener noreferrer' }).run();
  }, [editor]);

  if (!editor) return null;

  const Btn = ({ onClick, active, label }: { onClick: () => void; active?: boolean; label: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-sm rounded border ${
        active ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-1 p-2 border border-b-0 border-gray-300 rounded-t-md bg-gray-50">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="B" />
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="I" />
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label="S" />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="H2" />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="H3" />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="•" />
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="1." />
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="❝" />
      <Btn onClick={setLink} active={editor.isActive('link')} label="🔗" />
      <Btn onClick={() => editor.chain().focus().undo().run()} label="↶" />
      <Btn onClick={() => editor.chain().focus().redo().run()} label="↷" />
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'message-body max-w-none min-h-[240px] p-3 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white',
        'data-placeholder': placeholder || '',
      },
    },
    immediatelyRender: false,
  });

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
