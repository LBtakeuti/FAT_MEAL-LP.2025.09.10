'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface MediaLogo {
  id: string;
  name: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminMediaLogosPage() {
  const [logos, setLogos] = useState<MediaLogo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      const response = await fetch('/api/admin/media-logos');
      if (response.ok) {
        const data = await response.json();
        setLogos(data);
      }
    } catch (error) {
      console.error('Failed to fetch media logos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このメディアロゴを削除してもよろしいですか？')) return;
    try {
      const response = await fetch(`/api/admin/media-logos/${id}`, { method: 'DELETE' });
      if (response.ok) fetchLogos();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleActive = async (item: MediaLogo) => {
    try {
      const response = await fetch(`/api/admin/media-logos/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, is_active: !item.is_active }),
      });
      if (response.ok) fetchLogos();
    } catch (error) {
      console.error('Failed to toggle:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">メディアロゴ管理</h1>
              <p className="text-sm text-gray-500 mt-1">ヒーローセクション直下の無限スクロールに表示されます</p>
            </div>
            <Link
              href="/admin/media-logos/new"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              新規追加
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ロゴ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">メディア名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">表示順</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有効</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-10 w-auto object-contain rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.is_active ? '有効' : '無効'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/admin/media-logos/${item.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        編集
                      </Link>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logos.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">メディアロゴがありません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
