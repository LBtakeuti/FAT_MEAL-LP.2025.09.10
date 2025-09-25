'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface InventoryItem {
  id: string;
  name: string;
  images: string[];
  stock: number;
  price: string;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/admin/inventory');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockUpdate = async (id: string, newStock: number) => {
    try {
      const response = await fetch(`/api/admin/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: newStock }),
      });

      if (response.ok) {
        setItems(items.map(item => 
          item.id === id ? { ...item, stock: newStock } : item
        ));
        setEditingId(null);
        setEditValue('');
      }
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  const handleEdit = (id: string, currentStock: number) => {
    setEditingId(id);
    setEditValue(currentStock.toString());
  };

  const handleSave = (id: string) => {
    const newStock = parseInt(editValue);
    if (!isNaN(newStock) && newStock >= 0) {
      handleStockUpdate(id, newStock);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: '在庫切れ', color: 'text-red-600 bg-red-50' };
    if (stock <= 50) return { text: '在庫少', color: 'text-orange-600 bg-orange-50' };
    return { text: '在庫あり', color: 'text-green-600 bg-green-50' };
  };

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">在庫管理</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded">
              <div className="text-green-800 text-sm font-medium">在庫あり</div>
              <div className="text-2xl font-bold text-green-600">
                {items.filter(item => item.stock > 50).length} 商品
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <div className="text-orange-800 text-sm font-medium">在庫少（50個以下）</div>
              <div className="text-2xl font-bold text-orange-600">
                {items.filter(item => item.stock > 0 && item.stock <= 50).length} 商品
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <div className="text-red-800 text-sm font-medium">在庫切れ</div>
              <div className="text-2xl font-bold text-red-600">
                {items.filter(item => item.stock === 0).length} 商品
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  価格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  現在の在庫
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => {
                const status = getStockStatus(item.stock);
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="relative w-12 h-12 mr-4">
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.price}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-900">
                          {item.stock} 個
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editingId === item.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(item.id)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditValue('');
                            }}
                            className="text-gray-600 hover:text-gray-900 font-medium"
                          >
                            キャンセル
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(item.id, item.stock)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          在庫を更新
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">ヒント</h3>
        <p className="text-sm text-blue-700">
          在庫が50個以下になると警告が表示されます。定期的に在庫を確認し、必要に応じて補充してください。
        </p>
      </div>
    </div>
  );
}