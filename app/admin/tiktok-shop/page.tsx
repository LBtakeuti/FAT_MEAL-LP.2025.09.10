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
          <h1 className="text-2xl font-bold text-gray-900">TikTok Shop 注文管理</h1>
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600 mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">注文ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">注文日時</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品 / SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">お届け先</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">追跡番号</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{o.tiktok_order_id}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {o.created_time ? new Date(o.created_time).toLocaleString('ja-JP') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{o.product_name}</div>
                      <div className="text-xs text-gray-500 font-mono">{o.seller_sku}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{o.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{o.order_amount}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{formatName(o)}</div>
                      <div className="text-xs text-gray-500">{formatAddress(o)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-700">{o.tracking_id || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 px-2">
                        {o.order_status || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
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
