'use client';

import { useState, useEffect } from 'react';

interface InventoryData {
  id: string;
  stockSets: number;
  itemsPerSet: number;
  updatedAt: string;
}

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
        setEditValue(data.stockSets.toString());
      } else {
        setError('在庫情報の取得に失敗しました');
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setError('在庫情報の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const newStockSets = parseInt(editValue);
    if (isNaN(newStockSets) || newStockSets < 0) {
      setError('在庫数は0以上の数値を入力してください');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stockSets: newStockSets }),
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data);
        setIsEditing(false);
        setSuccessMessage('在庫を更新しました');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || '在庫の更新に失敗しました');
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
      setError('在庫の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const getStockStatus = (stockSets: number) => {
    if (stockSets === 0) return { text: '在庫切れ', color: 'text-red-600 bg-red-50', dotColor: 'bg-red-500' };
    if (stockSets <= 10) return { text: '在庫少', color: 'text-orange-600 bg-orange-50', dotColor: 'bg-orange-500' };
    return { text: '在庫あり', color: 'text-green-600 bg-green-50', dotColor: 'bg-green-500' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  const status = inventory ? getStockStatus(inventory.stockSets) : null;
  const totalMeals = inventory ? inventory.stockSets * inventory.itemsPerSet : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">在庫管理</h1>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">6食セット在庫</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-blue-800 text-sm font-medium">セット在庫数</div>
              <div className="text-3xl font-bold text-blue-600">
                {inventory?.stockSets ?? 0} <span className="text-lg font-normal">セット</span>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-purple-800 text-sm font-medium">食数換算</div>
              <div className="text-3xl font-bold text-purple-600">
                {totalMeals} <span className="text-lg font-normal">食分</span>
              </div>
            </div>
            <div className={`p-4 rounded-lg ${status?.color || 'bg-gray-50'}`}>
              <div className="text-sm font-medium">ステータス</div>
              <div className="flex items-center mt-1">
                <span className={`w-3 h-3 rounded-full ${status?.dotColor || 'bg-gray-400'} mr-2`}></span>
                <span className="text-xl font-bold">{status?.text || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              在庫数を更新
            </label>

            {isEditing ? (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      min="0"
                      placeholder="セット数を入力"
                      disabled={isSaving}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                      セット
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {parseInt(editValue) > 0 ? `= ${parseInt(editValue) * (inventory?.itemsPerSet || 6)}食分` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditValue(inventory?.stockSets.toString() || '0');
                      setError(null);
                    }}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-lg">
                  <span className="font-bold">{inventory?.stockSets ?? 0}</span>
                  <span className="text-gray-500 ml-2">セット</span>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  在庫を更新
                </button>
              </div>
            )}
          </div>

          {inventory?.updatedAt && (
            <p className="text-sm text-gray-500 mt-4">
              最終更新: {new Date(inventory.updatedAt).toLocaleString('ja-JP')}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">在庫管理について</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>・在庫は6食セット単位で管理されます</li>
          <li>・お試し購入時は1セット、6食プランは2セット、12食プランは4セット、24食プランは8セットが減ります</li>
          <li>・在庫が10セット以下になると警告が表示されます</li>
          <li>・在庫が0になると購入ができなくなります</li>
        </ul>
      </div>
    </div>
  );
}
