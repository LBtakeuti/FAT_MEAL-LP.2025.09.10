'use client';

import React, { useEffect, useState } from 'react';

interface TikTokOrder {
  id: string;
  tiktok_order_id: string;
  order_status: string | null;
  seller_sku: string | null;
  product_name: string | null;
  quantity: number;
  order_amount: string | null;
  created_time: string | null;
  paid_time: string | null;
  shipped_time: string | null;
  tracking_id: string | null;
  recipient: string | null;
  first_name: string | null;
  last_name: string | null;
  prefecture: string | null;
  city_ward: string | null;
  address_line_1: string | null;
  phone: string | null;
  status: string;
}

export default function AdminTikTokShopPage() {
  const [orders, setOrders] = useState<TikTokOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ imported: number; parsed: number; warnings: string[] } | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/tiktok-shop');
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/tiktok-shop/import', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || '取込に失敗しました');
        return;
      }
      setUploadResult(data);
      fetchOrders();
    } catch (e) {
      console.error(e);
      alert('取込エラー');
    } finally {
      setUploading(false);
    }
  };

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/tiktok-shop/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      } else {
        const data = await res.json();
        alert(data.message || 'ステータス更新に失敗しました');
      }
    } catch {
      alert('ステータス更新に失敗しました');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この注文を削除しますか？')) return;
    await fetch(`/api/admin/tiktok-shop/${id}`, { method: 'DELETE' });
    fetchOrders();
  };

  const formatAddress = (o: TikTokOrder) =>
    [o.prefecture, o.city_ward, o.address_line_1].filter(Boolean).join(' ');

  const formatName = (o: TikTokOrder) => {
    if (o.recipient) return o.recipient;
    return [o.last_name, o.first_name].filter(Boolean).join(' ');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">TikTok Shop 注文管理</h1>
          <label className="cursor-pointer inline-flex items-center px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium disabled:opacity-50">
            <span>{uploading ? '取込中...' : 'CSVを取り込む'}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {uploadResult && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            <div>取込完了: {uploadResult.imported} 件（解析 {uploadResult.parsed} 件）</div>
            {uploadResult.warnings.length > 0 && (
              <ul className="mt-1 text-xs list-disc pl-5">
                {uploadResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">配送日</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">種別</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">お客様名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">プラン</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">個数</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {o.created_time ? o.created_time.slice(0, 10) : '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-pink-100 text-pink-800 font-medium">TikTok</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatName(o)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={o.product_name || ''}>{o.product_name || o.seller_sku || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {o.quantity}個
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        disabled={updatingId === o.id}
                        className={`px-2 py-1 text-xs rounded-full font-semibold border-0 cursor-pointer focus:ring-2 focus:ring-orange-500 ${
                          o.status === 'shipped' ? 'bg-green-100 text-green-800' :
                          o.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-700'
                        } ${updatingId === o.id ? 'opacity-50' : ''}`}
                      >
                        <option value="pending">未発送</option>
                        <option value="confirmed">確認済</option>
                        <option value="shipped">発送済</option>
                        <option value="cancelled">キャンセル</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-right text-sm">
                      <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:text-red-900">
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">まだ注文がありません。CSVから取り込んでください。</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
