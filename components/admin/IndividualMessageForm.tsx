'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from './RichTextEditor';

export interface MessageFormData {
  slug: string;
  title: string;
  body_html: string;
  images: string[];
  is_active: boolean;
}

interface Props {
  mode: 'create' | 'edit';
  id?: string;
  initial: MessageFormData;
}

export function IndividualMessageForm({ mode, id, initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<MessageFormData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('bucket', 'images');
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        if (res.ok) {
          const { url } = await res.json();
          urls.push(url);
        } else {
          const d = await res.json();
          alert(d.message || 'アップロードに失敗しました');
        }
      }
      setForm((p) => ({ ...p, images: [...p.images, ...urls] }));
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (from: number, to: number) => {
    setForm((p) => {
      const next = [...p.images];
      if (to < 0 || to >= next.length) return p;
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return { ...p, images: next };
    });
  };

  const removeImage = (index: number) => {
    setForm((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const url = mode === 'create' ? '/api/admin/messages' : `/api/admin/messages/${id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/messages');
        router.refresh();
      } else {
        const d = await res.json();
        setError(d.message || '保存に失敗しました');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? '個別メッセージ新規作成' : '個別メッセージ編集'}
          </h1>
          <button
            type="button"
            onClick={() => router.push('/admin/messages')}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50"
          >
            一覧に戻る
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          {/* スラグ */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              スラグ <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-400">半角英数字とハイフンのみ（例: yusaku-sports）</span>
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                /message/
              </span>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                pattern="^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$"
                placeholder="example-slug"
                className="flex-1 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            {form.slug && (
              <p className="text-xs text-gray-500 mt-1">
                公開URL: <code>/message/{form.slug}</code>
              </p>
            )}
          </div>

          {/* 画像 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              画像（複数可・2枚以上でカルーセル表示）
            </label>
            <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 cursor-pointer">
              <span className="text-sm font-medium">{uploading ? 'アップロード中...' : 'ファイルを追加'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={(e) => handleUpload(e.target.files)}
              />
            </label>

            {form.images.length > 0 && (
              <ul className="mt-4 space-y-3">
                {form.images.map((src, i) => (
                  <li key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-20 h-20 object-cover rounded" />
                    <div className="flex-1 text-xs text-gray-600 break-all">{src}</div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(i, i - 1)}
                        disabled={i === 0}
                        className="px-2 py-1 text-sm border border-gray-300 rounded bg-white disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, i + 1)}
                        disabled={i === form.images.length - 1}
                        className="px-2 py-1 text-sm border border-gray-300 rounded bg-white disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="px-2 py-1 text-sm border border-red-300 text-red-600 rounded bg-white hover:bg-red-50"
                      >
                        削除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              見出し <span className="text-red-500">*</span>
              <span className="ml-2 text-xs text-gray-400">最大120文字</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            />
          </div>

          {/* 本文 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">本文</label>
            <RichTextEditor
              value={form.body_html}
              onChange={(html) => setForm({ ...form, body_html: html })}
            />
          </div>

          {/* 有効/無効 */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              有効（公開する）
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/admin/messages')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting || !form.slug || !form.title}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {submitting ? '保存中...' : mode === 'create' ? '作成' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
