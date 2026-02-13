'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AmbassadorItem {
  id: string;
  thumbnail_image: string;
  thumbnail_label: string | null;
  icon_image: string;
  department: string | null;
  date: string;
  title: string;
  description: string;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminAmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<AmbassadorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const fetchAmbassadors = async () => {
    try {
      const response = await fetch('/api/admin/ambassadors');
      if (response.ok) {
        const data = await response.json();
        setAmbassadors(data);
      }
    } catch (error) {
      console.error('Failed to fetch ambassadors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このアンバサダーを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/admin/ambassadors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAmbassadors();
      }
    } catch (error) {
      console.error('Failed to delete ambassador:', error);
    }
  };

  const handleToggleActive = async (item: AmbassadorItem) => {
    try {
      const response = await fetch(`/api/admin/ambassadors/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          is_active: !item.is_active,
        }),
      });

      if (response.ok) {
        fetchAmbassadors();
      }
    } catch (error) {
      console.error('Failed to toggle ambassador:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">アンバサダー管理</h1>
            <Link
              href="/admin/ambassadors/new"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              新規作成
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    サムネイル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    表示順
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    有効
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ambassadors.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={item.thumbnail_image}
                        alt={item.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {item.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                          item.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.is_active ? '有効' : '無効'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/ambassadors/${item.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ambassadors.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">アンバサダーがありません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
