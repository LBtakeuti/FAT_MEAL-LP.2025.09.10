'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface IndividualMessage {
  id: string;
  slug: string;
  title: string;
  body_html: string;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<IndividualMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/messages');
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const toggleActive = async (item: IndividualMessage) => {
    await fetch(`/api/admin/messages/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, is_active: !item.is_active }),
    });
    fetchMessages();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このメッセージを削除してもよろしいですか？')) return;
    await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
    fetchMessages();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">個別メッセージ管理</h1>
          <Link
            href="/admin/messages/new"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            新規作成
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">スラグ / URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">画像</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">有効</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-mono text-gray-900">{item.slug}</div>
                    <a
                      href={`/message/${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      /message/{item.slug}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{item.title}</div>
                    <div className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString('ja-JP')}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.images?.length || 0} 枚</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.is_active ? '有効' : '無効'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                    <Link href={`/admin/messages/${item.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">編集</Link>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-500">まだメッセージがありません</div>
          )}
        </div>
      </div>
    </div>
  );
}
