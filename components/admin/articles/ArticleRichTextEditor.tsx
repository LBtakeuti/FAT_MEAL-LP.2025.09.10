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

  const Btn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 text-sm rounded-md border ${
        active ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );

  // グループ区切り線
  const Divider = () => <span className="self-stretch border-l border-gray-300 mx-1" aria-hidden="true" />;

  // ツールバー用インラインSVGアイコン（16x16, currentColor）
  const ico = 'w-4 h-4';

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border border-b-0 border-gray-300 rounded-t-md bg-gray-50">
      {/* 装飾 */}
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="太字 (Ctrl+B)">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 4h7a4 4 0 0 1 0 8H6z" />
          <path d="M6 12h8a4 4 0 0 1 0 8H6z" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="斜体 (Ctrl+I)">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="19" y1="4" x2="10" y2="4" />
          <line x1="14" y1="20" x2="5" y2="20" />
          <line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="取消線">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 4H9a3 3 0 0 0-2.83 4" />
          <path d="M14 12a4 4 0 0 1 0 8H6" />
          <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
      </Btn>

      <Divider />

      {/* 見出し */}
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="見出し2">
        <span className="font-semibold text-xs">H2</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="見出し3">
        <span className="font-semibold text-xs">H3</span>
      </Btn>

      <Divider />

      {/* リスト */}
      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="箇条書き">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="番号付きリスト">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="10" y1="6" x2="20" y2="6" />
          <line x1="10" y1="12" x2="20" y2="12" />
          <line x1="10" y1="18" x2="20" y2="18" />
          <path d="M4 4h1.5v4" />
          <path d="M4 8h3" strokeWidth="1.5" />
          <path d="M4 14h2.5a.5.5 0 0 1 0 2H4.5l2-2" strokeWidth="1.5" fill="none" />
          <path d="M4.5 20h2.5" strokeWidth="1.5" />
        </svg>
      </Btn>

      <Divider />

      {/* 引用 */}
      <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="引用">
        <svg className={ico} viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
          <path d="M7 6c-2.2 0-4 1.8-4 4v6h6v-6H5c0-1.1.9-2 2-2zM17 6c-2.2 0-4 1.8-4 4v6h6v-6h-4c0-1.1.9-2 2-2z" />
        </svg>
      </Btn>

      <Divider />

      {/* 挿入 */}
      <Btn onClick={setLink} active={editor.isActive('link')} title="リンク (Ctrl+K)">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
        </svg>
      </Btn>
      <Btn onClick={onUpload} title="画像を挿入">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9" r="1.5" />
          <path d="m21 16-5-5L5 20" />
        </svg>
      </Btn>

      <Divider />

      {/* 履歴 */}
      <Btn onClick={() => editor.chain().focus().undo().run()} title="元に戻す (Ctrl+Z)">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 7v6h6" />
          <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
        </svg>
      </Btn>
      <Btn onClick={() => editor.chain().focus().redo().run()} title="やり直す (Ctrl+Shift+Z)">
        <svg className={ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 7v6h-6" />
          <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
        </svg>
      </Btn>
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
