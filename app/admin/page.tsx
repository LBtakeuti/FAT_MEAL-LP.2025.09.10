'use client';

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMenuItems: 0,
    totalStock: 0,
    totalNews: 0,
    totalContacts: 0,
    pendingContacts: 0,
    lowStockItems: 0
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
          <div className="text-gray-600 text-sm">在庫警告</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{stats.lowStockItems}</div>
          <div className="text-xs text-gray-500 mt-1">在庫50個以下</div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/menu/new"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span>新しい弁当を追加</span>
          </a>
          
          <a
            href="/admin/news/new"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            <span>ニュースを投稿</span>
          </a>
          
          <a
            href="/admin/contacts"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
          >
            <span>お問い合わせ確認</span>
          </a>
          
          <a
            href="/admin/inventory"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <span>在庫を確認</span>
          </a>
        </div>
      </div>
    </div>
  );
}