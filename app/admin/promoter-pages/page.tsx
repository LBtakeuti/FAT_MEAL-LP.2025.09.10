'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PromoterBlock } from '@/lib/types/promoter';

interface PromoterPageRow {
  id: string;
  slug: string;
  title: string | null;
  blocks: PromoterBlock[];
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

export default function PromoterPagesAdmin() {
  const [rows, setRows] = useState<PromoterPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PromoterPageRow | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pagesRes = await fetch('/api/admin/promoter-pages');
      if (!pagesRes.ok) throw new Error('個別メッセージの取得に失敗しました');
      const pagesData = await pagesRes.json();
      setRows(Array.isArray(pagesData) ? pagesData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '読み込みエラー');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing({
      id: '',
      slug: '',
      title: '',
      blocks: [],
      is_active: true,
      view_count: 0,
      created_at: '',
      updated_at: '',
    });
    setShowForm(true);
  };

  const openEdit = (row: PromoterPageRow) => {
    setEditing({ ...row, blocks: row.blocks || [] });
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  const save = async () => {
    if (!editing) return;
    if (!SLUG_PATTERN.test(editing.slug)) {
      alert('slug は半角英数とハイフンのみで入力してください');
      return;
    }
    const payload = {
      slug: editing.slug,
      title: editing.title,
      blocks: editing.blocks,
      is_active: editing.is_active,
    };
    try {
      const res = editing.id
        ? await fetch(`/api/admin/promoter-pages/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/promoter-pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '保存に失敗しました');
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存エラー');
    }
  };

  const remove = async (row: PromoterPageRow) => {
    if (!confirm(`「${row.slug}」を削除しますか？`)) return;
    const res = await fetch(`/api/admin/promoter-pages/${row.id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('削除に失敗しました');
      return;
    }
    await load();
  };

  const updateBlock = (index: number, updates: Partial<PromoterBlock>) => {
    if (!editing) return;
    const blocks = [...editing.blocks];
    const current = blocks[index];
    blocks[index] = { ...current, ...updates } as PromoterBlock;
    setEditing({ ...editing, blocks });
  };

  const removeBlock = (index: number) => {
    if (!editing) return;
    const blocks = editing.blocks.filter((_, i) => i !== index);
    setEditing({ ...editing, blocks });
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    if (!editing) return;
    const target = index + dir;
    if (target < 0 || target >= editing.blocks.length) return;
    const blocks = [...editing.blocks];
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    setEditing({ ...editing, blocks });
  };

  const addBlock = (type: 'text' | 'image') => {
    if (!editing) return;
    const newBlock: PromoterBlock =
      type === 'text' ? { type: 'text', value: '' } : { type: 'image', value: '', alt: '' };
    setEditing({ ...editing, blocks: [...editing.blocks, newBlock] });
  };

  const uploadImage = async (index: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('bucket', 'images');
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      alert('画像アップロードに失敗しました');
      return;
    }
    const data = await res.json();
    updateBlock(index, { type: 'image', value: data.url } as PromoterBlock);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">個別メッセージ</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          新規作成
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">プレビュー数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ブロック数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">公開</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新日時</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    レコードがありません
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3 font-mono text-sm">
                        <a
                          href={`/p/${r.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:underline"
                        >
                          {r.slug}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm">{r.title || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium">{r.view_count ?? 0}</td>
                      <td className="px-4 py-3 text-sm">{(r.blocks || []).length}</td>
                      <td className="px-4 py-3 text-sm">
                        {r.is_active ? (
                          <span className="text-green-700">公開中</span>
                        ) : (
                          <span className="text-gray-400">非公開</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(r.updated_at).toLocaleString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <button
                          onClick={() => openEdit(r)}
                          className="text-blue-600 hover:underline mr-3"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => remove(r)}
                          className="text-red-600 hover:underline"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && editing && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editing.id ? '個別メッセージを編集' : '個別メッセージを新規作成'}
              </h2>
              <button onClick={cancel} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono"
                  placeholder="例: yusaku"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL: /p/{editing.slug || 'xxx'} — 半角英数とハイフンのみ
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">タイトル（任意）</label>
                <input
                  type="text"
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />
                  <span className="text-sm">公開する</span>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">コンテンツブロック</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addBlock('text')}
                      className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                    >
                      + テキスト
                    </button>
                    <button
                      type="button"
                      onClick={() => addBlock('image')}
                      className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200"
                    >
                      + 画像
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {editing.blocks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4 border border-dashed rounded">
                      ブロックがありません
                    </p>
                  )}
                  {editing.blocks.map((block, i) => (
                    <div key={i} className="border border-gray-200 rounded p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-600">
                          {block.type === 'text' ? 'テキスト' : '画像'} #{i + 1}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(i, -1)}
                            disabled={i === 0}
                            className="px-2 py-0.5 text-xs bg-white border rounded disabled:opacity-30"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(i, 1)}
                            disabled={i === editing.blocks.length - 1}
                            className="px-2 py-0.5 text-xs bg-white border rounded disabled:opacity-30"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(i)}
                            className="px-2 py-0.5 text-xs bg-white border text-red-600 rounded"
                          >
                            削除
                          </button>
                        </div>
                      </div>

                      {block.type === 'text' ? (
                        <textarea
                          value={block.value}
                          onChange={(e) => updateBlock(i, { value: e.target.value })}
                          rows={4}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="テキストを入力"
                        />
                      ) : (
                        <div className="space-y-2">
                          {block.value && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={block.value}
                              alt=""
                              className="max-h-48 rounded border"
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadImage(i, f);
                            }}
                            className="text-sm"
                          />
                          <input
                            type="text"
                            value={block.alt || ''}
                            onChange={(e) => updateBlock(i, { alt: e.target.value })}
                            placeholder="alt テキスト（任意）"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button onClick={cancel} className="px-4 py-2 border border-gray-300 rounded">
                キャンセル
              </button>
              <button
                onClick={save}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
