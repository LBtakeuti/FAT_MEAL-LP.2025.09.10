'use client';

import { useEffect, useState } from 'react';

interface MediaItem {
  name: string;
  url: string;
  size: number | null;
  mimetype: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}

/**
 * F51-3: メディアライブラリから画像を選ぶモーダル。
 * 「画像を選択」ボタンから呼び出し、クリックで onSelect を返す。
 */
export default function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res = await fetch('/api/admin/media/list?limit=200');
        if (!res.ok) throw new Error('取得失敗');
        const data = await res.json();
        setItems(Array.isArray(data?.items) ? data.items : []);
      } catch (err: any) {
        console.error('[MediaPickerModal] fetch failed', err);
        setError('メディア一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">メディアから選択</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">
              アップロード済み画像がありません
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {items.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group relative aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-200 hover:border-orange-500 transition-colors"
                  title={item.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
