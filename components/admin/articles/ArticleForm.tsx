'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ConfirmDialog, useToast } from '@/components/admin/ui';
import { ArticleRichTextEditor } from './ArticleRichTextEditor';
import ArticlePreview from './ArticlePreview';
import { htmlToMarkdown, markdownToHtml } from '@/lib/article-markdown';

export interface ArticleFormInitial {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown
  thumbnail_url: string;
  tags: string[];
  author: string;
  is_published: boolean;
  published_at: string | null; // ISO
  meta_title: string;
  meta_description: string;
  og_image_url: string;
}

export const EMPTY_INITIAL: ArticleFormInitial = {
  slug: '',
  title: '',
  excerpt: '',
  content: '',
  thumbnail_url: '',
  tags: [],
  author: 'ふとるめし編集部',
  is_published: false,
  published_at: null,
  meta_title: '',
  meta_description: '',
  og_image_url: '',
};

interface Props {
  mode: 'create' | 'edit';
  initial: ArticleFormInitial;
}

function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function localInputToIso(local: string): string | null {
  if (!local) return null;
  return new Date(local).toISOString();
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
}

export function ArticleForm({ mode, initial }: Props) {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [editorHtml, setEditorHtml] = useState<string>(markdownToHtml(initial.content));
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnail_url);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(', '));
  const [author, setAuthor] = useState(initial.author);
  const [isPublished, setIsPublished] = useState(initial.is_published);
  const [publishedAtLocal, setPublishedAtLocal] = useState(isoToLocalInput(initial.published_at));
  const [metaTitle, setMetaTitle] = useState(initial.meta_title);
  const [metaDescription, setMetaDescription] = useState(initial.meta_description);
  const [ogImageUrl, setOgImageUrl] = useState(initial.og_image_url);

  const [thumbUploading, setThumbUploading] = useState(false);
  const [ogUploading, setOgUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // F51-1: 本文を「編集」「プレビュー」タブで切り替える
  const [bodyTab, setBodyTab] = useState<'edit' | 'preview'>('edit');

  const uploadOgImage = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error('画像サイズは4MB以下にしてください');
      return;
    }
    setOgUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'images');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || 'アップロードに失敗しました');
        return;
      }
      if (json?.url) {
        setOgImageUrl(json.url);
        toast.success('OG画像をアップロードしました');
      }
    } catch (err) {
      console.error('og image upload error', err);
      toast.error('アップロード中にエラーが発生しました');
    } finally {
      setOgUploading(false);
    }
  };

  const useThumbnailAsOgImage = () => {
    if (!thumbnailUrl) {
      toast.error('先にサムネ画像を設定してください');
      return;
    }
    setOgImageUrl(thumbnailUrl);
    toast.success('サムネ画像をOG画像にコピーしました');
  };

  const uploadThumbnail = async (file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error('画像サイズは4MB以下にしてください');
      return;
    }
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'images');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || 'アップロードに失敗しました');
        return;
      }
      if (json?.url) {
        setThumbnailUrl(json.url);
        toast.success('サムネ画像をアップロードしました');
      }
    } catch (err) {
      console.error('thumbnail upload error', err);
      toast.error('アップロード中にエラーが発生しました');
    } finally {
      setThumbUploading(false);
    }
  };

  const save = async (publish?: boolean) => {
    if (!title.trim()) { toast.error('タイトルは必須です'); return; }
    if (!slug.trim()) { toast.error('slug は必須です'); return; }
    const markdown = htmlToMarkdown(editorHtml);
    if (!markdown) { toast.error('本文は必須です'); return; }

    const body = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt || null,
      content: markdown,
      thumbnail_url: thumbnailUrl || null,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      author: author.trim() || 'ふとるめし編集部',
      is_published: publish !== undefined ? publish : isPublished,
      published_at: localInputToIso(publishedAtLocal),
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      og_image_url: ogImageUrl || null,
    };

    setSaving(true);
    try {
      const url = mode === 'create' ? '/api/admin/articles' : `/api/admin/articles/${initial.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.message || json?.error || '保存に失敗しました');
        return;
      }
      toast.success(publish ? '公開しました' : '保存しました');
      if (mode === 'create' && json?.article?.id) {
        router.push(`/admin/articles/${json.article.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('save error', err);
      toast.error('保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${initial.id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('削除に失敗しました');
        return;
      }
      toast.success('削除しました');
      router.push('/admin/articles');
    } catch (err) {
      console.error('delete error', err);
      toast.error('削除中にエラーが発生しました');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] gap-6">
      <div className="bg-white rounded-md shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">タイトル <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (mode === 'create' && !slug) setSlug(slugify(e.target.value));
            }}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">slug <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-article-slug"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="button"
              onClick={() => setSlug(slugify(title))}
              className="text-xs px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              タイトルから生成
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">URL: /blog/{slug || '<slug>'}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">抜粋（excerpt）</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <div className="flex items-end justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-700">
              本文 <span className="text-red-500">*</span>
            </label>
            {/* F51-1: 編集 / プレビュー タブ */}
            <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setBodyTab('edit')}
                className={`px-3 py-1 text-xs font-medium ${
                  bodyTab === 'edit'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                編集
              </button>
              <button
                type="button"
                onClick={() => setBodyTab('preview')}
                className={`px-3 py-1 text-xs font-medium border-l border-gray-300 ${
                  bodyTab === 'preview'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                プレビュー
              </button>
            </div>
          </div>
          {bodyTab === 'edit' ? (
            <>
              <p className="mb-2 text-xs text-gray-500">画像挿入ボタン（🖼）で画像をアップロード・挿入できます。保存時に Markdown へ変換されます。</p>
              <ArticleRichTextEditor value={editorHtml} onChange={setEditorHtml} />
            </>
          ) : (
            <ArticlePreview
              title={title}
              author={author || 'ふとるめし編集部'}
              publishedAt={localInputToIso(publishedAtLocal)}
              tags={tagsInput.split(',').map((t) => t.trim()).filter(Boolean)}
              excerpt={excerpt}
              markdown={htmlToMarkdown(editorHtml)}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-md shadow p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">公開設定</h3>
          <label className="flex items-center gap-2 text-sm mb-3">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4"
            />
            公開する
          </label>
          <label className="block text-xs font-semibold text-gray-600 mb-1">公開日時</label>
          <input
            type="datetime-local"
            value={publishedAtLocal}
            onChange={(e) => setPublishedAtLocal(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <p className="mt-1 text-[11px] text-gray-500">未入力の場合、公開時に自動で現在時刻が入ります。</p>
        </div>

        <div className="bg-white rounded-md shadow p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">サムネイル画像</h3>
          {thumbnailUrl ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md bg-gray-100 mb-2">
              <Image src={thumbnailUrl} alt="サムネ" fill sizes="240px" className="object-cover" />
            </div>
          ) : (
            <div className="aspect-[16/9] w-full rounded-md bg-gray-100 mb-2 flex items-center justify-center text-xs text-gray-400">未設定</div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadThumbnail(f); }}
            disabled={thumbUploading}
            className="text-xs"
          />
          {thumbnailUrl && (
            <button
              type="button"
              onClick={() => setThumbnailUrl('')}
              className="ml-2 text-xs text-red-600 hover:underline"
            >
              削除
            </button>
          )}
        </div>

        <div className="bg-white rounded-md shadow p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">タグ・著者</h3>
          <label className="block text-xs font-semibold text-gray-600 mb-1">タグ（カンマ区切り）</label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="太りたい, 部活, 栄養"
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <p className="text-[11px] text-gray-500 mb-3">先頭タグが /blog 一覧のカテゴリラベルとして表示されます。</p>
          <label className="block text-xs font-semibold text-gray-600 mb-1">著者</label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="bg-white rounded-md shadow p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">SEO</h3>
          <label className="block text-xs font-semibold text-gray-600 mb-1">meta title</label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <label className="block text-xs font-semibold text-gray-600 mb-1">meta description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <label className="block text-xs font-semibold text-gray-600 mb-1">OG画像</label>
          <input
            type="url"
            value={ogImageUrl}
            onChange={(e) => setOgImageUrl(e.target.value)}
            placeholder="https://... または下のボタンからアップロード"
            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
          />
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <label
              className={`inline-flex items-center px-3 py-1 text-xs rounded-md border border-gray-300 cursor-pointer hover:bg-gray-50 ${
                ogUploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {ogUploading ? 'アップロード中...' : '画像をアップロード'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) uploadOgImage(f);
                }}
                disabled={ogUploading}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={useThumbnailAsOgImage}
              disabled={!thumbnailUrl}
              className="inline-flex items-center px-3 py-1 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title={!thumbnailUrl ? '先にサムネ画像を設定してください' : undefined}
            >
              サムネと同じ画像を使う
            </button>
            {ogImageUrl && (
              <button
                type="button"
                onClick={() => setOgImageUrl('')}
                className="text-xs text-red-600 hover:underline"
              >
                クリア
              </button>
            )}
          </div>
          {ogImageUrl && (
            <div className="relative aspect-[1200/630] w-full overflow-hidden rounded-md bg-gray-100 border border-gray-200">
              <Image src={ogImageUrl} alt="OG画像プレビュー" fill sizes="240px" className="object-cover" />
            </div>
          )}
        </div>

        <div className="bg-white rounded-md shadow p-5 space-y-2">
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            公開して保存
          </button>
          {mode === 'edit' && initial.slug && (
            <a
              href={`/blog/${initial.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-sm border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100"
            >
              公開ページを開く
            </a>
          )}
          {mode === 'edit' && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="w-full text-sm text-red-600 border border-red-300 px-4 py-2 rounded-md hover:bg-red-50 disabled:opacity-50"
            >
              この記事を削除
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="記事を削除しますか？"
        description="削除すると元に戻せません。"
        confirmLabel="削除する"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
