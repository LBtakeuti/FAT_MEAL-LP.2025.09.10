'use client';

import { useCallback, useEffect, useState } from 'react';

interface MediaItem {
  name: string;
  url: string;
  size: number | null;
  mimetype: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('ja-JP');
}

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string>('');
  const [deleteName, setDeleteName] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/media/list?limit=200');
      if (!res.ok) throw new Error('取得失敗');
      const data = await res.json();
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (err: any) {
      console.error('[admin/media] fetch failed', err);
      setError('メディア一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(''), 2000);
    } catch (err) {
      console.error('[admin/media] copy failed', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteName) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deleteName }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.message || json?.error || '削除に失敗しました');
        return;
      }
      setDeleteName('');
      fetchList();
    } catch (err) {
      console.error('[admin/media] delete failed', err);
      setError('削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">メディアライブラリ</h1>
      <p className="text-sm text-gray-500 mb-6">
        Supabase Storage の <code className="bg-gray-100 px-1 rounded">images</code> バケットに保存された画像の一覧です。
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">読み込み中...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-sm">
          アップロード済み画像がありません
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.name}
              className="bg-white rounded-md shadow-sm overflow-hidden flex flex-col"
            >
              <div className="relative aspect-square bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-3 flex-1 flex flex-col gap-1 text-xs">
                <div className="truncate font-medium text-gray-900" title={item.name}>
                  {item.name}
                </div>
                <div className="text-gray-500">{formatDate(item.created_at)}</div>
                <div className="text-gray-500">{formatSize(item.size)}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.url)}
                    className="flex-1 px-2 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-900"
                  >
                    {copiedUrl === item.url ? 'コピー済' : 'URLコピー'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteName(item.name)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteName && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-gray-900 mb-3">画像を削除しますか？</h3>
            <p className="text-sm text-gray-700 mb-2">この操作は取り消せません。</p>
            <p className="text-xs text-gray-500 mb-4 break-all">{deleteName}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteName('')}
                disabled={deleting}
                className="flex-1 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
