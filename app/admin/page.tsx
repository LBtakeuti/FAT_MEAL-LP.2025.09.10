'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMenuItems: 0,
    totalStock: 0,
    totalNews: 0,
    totalContacts: 0,
    pendingContacts: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    // サブスクリプション統計
    activeSubscriptions: 0,
    upcomingDeliveries: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">メニュー数</div>
          <div className="text-3xl font-bold mt-2">{stats.totalMenuItems}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">ニュース記事</div>
          <div className="text-3xl font-bold mt-2">{stats.totalNews}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">お問い合わせ</div>
          <div className="text-3xl font-bold mt-2">{stats.totalContacts}</div>
          {stats.pendingContacts > 0 && (
            <div className="text-xs text-orange-600 mt-1">未対応: {stats.pendingContacts}件</div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">未処理注文</div>
          <div className={`text-3xl font-bold mt-2 ${stats.pendingOrders > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
            {stats.pendingOrders}
          </div>
          {stats.pendingOrders > 0 && (
            <div className="text-xs text-orange-600 mt-1">対応が必要です</div>
          )}
        </div>

        {/* サブスクリプション統計 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">アクティブなサブスク</div>
          <div className="text-3xl font-bold mt-2 text-blue-600">{stats.activeSubscriptions}</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-gray-600 text-sm">今週配送予定</div>
          <div className={`text-3xl font-bold mt-2 ${stats.upcomingDeliveries > 0 ? 'text-green-600' : 'text-gray-900'}`}>
            {stats.upcomingDeliveries}
          </div>
          {stats.upcomingDeliveries > 0 && (
            <div className="text-xs text-green-600 mt-1">件の配送が予定されています</div>
          )}
        </div>
      </div>
    </div>
  );
}