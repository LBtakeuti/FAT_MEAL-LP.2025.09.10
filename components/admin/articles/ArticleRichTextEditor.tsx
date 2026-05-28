'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

interface ArticleRichTextEditorProps {
  value: string; // HTML
  onChange: (html: string) => void;
  placeholder?: string;
}

function Toolbar({ editor, onUpload }: { editor: Editor | null; onUpload: () => void }) {
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

  const Btn = ({ onClick, active, label, title }: { onClick: () => void; active?: boolean; label: string; title?: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2.5 py-1 text-sm rounded-md border ${
        active ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-1 p-2 border border-b-0 border-gray-300 rounded-t-md bg-gray-50">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label="B" title="太字" />
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label="I" title="斜体" />
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label="S" title="取り消し線" />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="H2" />
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="H3" />
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label="•" title="箇条書き" />
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label="1." title="番号付きリスト" />
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} label="❝" title="引用" />
      <Btn onClick={setLink} active={editor.isActive('link')} label="🔗" title="リンク" />
      <Btn onClick={onUpload} label="🖼" title="画像を挿入" />
      <Btn onClick={() => editor.chain().focus().undo().run()} label="↶" title="元に戻す" />
      <Btn onClick={() => editor.chain().focus().redo().run()} label="↷" title="やり直し" />
    </div>
  );
}

export function ArticleRichTextEditor({ value, onChange, placeholder }: ArticleRichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'article-editor max-w-none min-h-[400px] p-4 border border-gray-300 rounded-b-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white',
        'data-placeholder': placeholder || '',
      },
    },
    immediatelyRender: false,
  });

  // 親側で value が外部更新（編集ロード）された場合に同期
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    if (file.size > 4 * 1024 * 1024) {
      window.alert('画像サイズは 4MB 以下にしてください');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'images');
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = text;
        try { msg = JSON.parse(text)?.message ?? text; } catch { /* plain */ }
        window.alert(msg || '画像アップロードに失敗しました');
        return;
      }
      const data = await res.json();
      const url: string | undefined = data?.url || data?.publicUrl || data?.data?.url;
      if (!url) {
        window.alert('アップロード結果に画像URLが含まれていません');
        return;
      }
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      console.error('[ArticleRichTextEditor] upload error', err);
      window.alert('画像アップロード中にエラーが発生しました');
    }
  };

  return (
    <div>
      <Toolbar editor={editor} onUpload={handleUploadClick} />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
