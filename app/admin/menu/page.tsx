'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  main_image: string | null;
  sub_images: string[];
  ingredients: string[];
  allergens: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/admin/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このメニューを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/admin/menu/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const item = menuItems.find(m => m.id === id);
      if (!item) return;

      const response = await fetch(`/api/admin/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...item,
          is_active: !currentStatus,
        }),
      });
      
      if (response.ok) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Failed to toggle active status:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">弁当管理</h1>
            <Link
              href="/admin/menu/new"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              新規追加
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    画像
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    栄養成分
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    価格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状態
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.main_image ? (
                        <div className="relative w-16 h-16 rounded overflow-hidden">
                          <Image
                            src={item.main_image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No Image</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{item.calories}kcal</div>
                        <div className="text-xs text-gray-500">
                          P:{item.protein}g F:{item.fat}g C:{item.carbs}g
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.price ? `¥${item.price.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(item.id, item.is_active)}
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.is_active ? '公開中' : '非公開'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/menu/${item.id}`}
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
            {menuItems.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">メニューがありません</p>
                <Link
                  href="/admin/menu/new"
                  className="text-orange-600 hover:text-orange-700 mt-2 inline-block"
                >
                  最初のメニューを追加
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
