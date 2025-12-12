'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Contact {
  id: string;
  title: string;
  name: string;
  name_kana: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'responded' | 'closed';
  created_at: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded' | 'closed'>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/admin/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Contact['status']) => {
    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchContacts();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このお問い合わせを削除してもよろしいですか？')) return;

    try {
      const response = await fetch(`/api/admin/contacts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchContacts();
        if (selectedContact?.id === id) {
          setSelectedContact(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const getStatusBadgeClass = (status: Contact['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'responded':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Contact['status']) => {
    switch (status) {
      case 'pending':
        return '未対応';
      case 'responded':
        return '対応済み';
      case 'closed':
        return '完了';
      default:
        return status;
    }
  };

  const filteredContacts = contacts.filter(contact =>
    filter === 'all' ? true : contact.status === filter
  );

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
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">お問い合わせ管理</h1>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← 管理画面に戻る
              </Link>
            </div>

            {/* フィルター */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて ({contacts.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                未対応 ({contacts.filter(c => c.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('responded')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'responded'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                対応済み ({contacts.filter(c => c.status === 'responded').length})
              </button>
              <button
                onClick={() => setFilter('closed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'closed'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                完了 ({contacts.filter(c => c.status === 'closed').length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日時
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    件名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    お名前(漢字)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    お名前(カナ)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    メール
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    電話番号
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedContact?.id === contact.id ? 'bg-orange-50' : ''}`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-[120px] truncate">
                        {contact.title || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {contact.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {contact.name_kana || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contact.email}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{contact.phone || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={contact.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(contact.id, e.target.value as Contact['status']);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={`px-2 py-1 text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(contact.status)}`}
                      >
                        <option value="pending">未対応</option>
                        <option value="responded">対応済み</option>
                        <option value="closed">完了</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredContacts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">お問い合わせがありません</p>
              </div>
            )}
          </div>
        </div>

        {/* 詳細パネル */}
        {selectedContact && (
          <div className="mt-6 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">お問い合わせ詳細</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">件名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedContact.title || '（なし）'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">受信日時</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(selectedContact.created_at).toLocaleString('ja-JP')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">お名前(漢字)</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedContact.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">お名前(カナ)</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedContact.name_kana || '（なし）'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <a href={`mailto:${selectedContact.email}`} className="text-orange-600 hover:underline">
                      {selectedContact.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedContact.phone ? (
                      <a href={`tel:${selectedContact.phone}`} className="text-orange-600 hover:underline">
                        {selectedContact.phone}
                      </a>
                    ) : '（なし）'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">ステータス</dt>
                  <dd className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(selectedContact.status)}`}>
                      {getStatusLabel(selectedContact.status)}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <dt className="text-sm font-medium text-gray-500">メッセージ</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedContact.message || '（なし）'}
                </dd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
