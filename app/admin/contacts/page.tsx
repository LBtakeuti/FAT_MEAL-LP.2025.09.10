'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConfirmDialog, DateRangePicker, useToast } from '@/components/admin/ui';

// 今月（JST月初〜今日）の初期範囲
const getThisMonthRange = (): { from: string; to: string } => {
  const jstOffset = 9 * 60 * 60 * 1000;
  const jst = new Date(Date.now() + jstOffset);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const d = jst.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    from: `${y}-${pad(m + 1)}-01`,
    to: `${y}-${pad(m + 1)}-${pad(d)}`,
  };
};

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

function AdminContactsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status');
  const initialRange = (() => {
    const f = searchParams.get('from');
    const t = searchParams.get('to');
    if (f && t) return { from: f, to: t };
    return getThisMonthRange();
  })();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'responded' | 'closed'>(
    initialStatus === 'pending' || initialStatus === 'responded' || initialStatus === 'closed'
      ? initialStatus
      : 'all'
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>(initialRange.from);
  const [dateTo, setDateTo] = useState<string>(initialRange.to);
  const toast = useToast();

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const fetchContacts = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const url = `/api/admin/contacts${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(dateFrom, dateTo);
  }, [fetchContacts, dateFrom, dateTo]);

  const updateDateRange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (filter !== 'all') params.set('status', filter);
    router.replace(`/admin/contacts${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
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
        fetchContacts(dateFrom, dateTo);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/contacts/${deleteId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('削除しました');
        if (expandedId === deleteId) setExpandedId(null);
        fetchContacts(dateFrom, dateTo);
      } else {
        toast.error('削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error('削除に失敗しました');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
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
              <h1 className="text-2xl font-bold text-gray-900 mb-6">お問い合わせ管理</h1>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← 管理画面に戻る
              </Link>
            </div>

            {/* 期間フィルタ */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <DateRangePicker from={dateFrom} to={dateTo} onChange={updateDateRange} />
              <span className="text-sm text-gray-600">
                期間: {dateFrom || '指定なし'} 〜 {dateTo || '指定なし'} / 全 {contacts.length} 件
              </span>
            </div>

            {/* ステータスフィルター */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                すべて ({contacts.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                未対応 ({contacts.filter(c => c.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilter('responded')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'responded'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                対応済み ({contacts.filter(c => c.status === 'responded').length})
              </button>
              <button
                onClick={() => setFilter('closed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'closed'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                {filteredContacts.flatMap((contact) => {
                  const isOpen = expandedId === contact.id;
                  const baseRow = (
                    <tr
                      key={contact.id}
                      className={`hover:bg-gray-50 cursor-pointer ${isOpen ? 'bg-orange-50' : ''}`}
                      onClick={() => toggleExpand(contact.id)}
                    >
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <svg
                            className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          {new Date(contact.created_at).toLocaleString('ja-JP')}
                        </span>
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
                  );

                  if (!isOpen) return [baseRow];

                  const expandRow = (
                    <tr key={`${contact.id}-detail`} className="bg-orange-50/30">
                      <td colSpan={8} className="px-6 py-5">
                        <div className="bg-white rounded-lg border border-orange-100 p-5">
                          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <dt className="text-xs font-medium text-gray-500">件名</dt>
                              <dd className="mt-1 text-sm text-gray-900">{contact.title || '（なし）'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-gray-500">受信日時</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {new Date(contact.created_at).toLocaleString('ja-JP')}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-gray-500">お名前(漢字)</dt>
                              <dd className="mt-1 text-sm text-gray-900">{contact.name}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-gray-500">お名前(カナ)</dt>
                              <dd className="mt-1 text-sm text-gray-900">{contact.name_kana || '（なし）'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-gray-500">メールアドレス</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                <a href={`mailto:${contact.email}`} className="text-orange-600 hover:underline">
                                  {contact.email}
                                </a>
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-gray-500">電話番号</dt>
                              <dd className="mt-1 text-sm text-gray-900">
                                {contact.phone ? (
                                  <a href={`tel:${contact.phone}`} className="text-orange-600 hover:underline">
                                    {contact.phone}
                                  </a>
                                ) : '（なし）'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-gray-500">ステータス</dt>
                              <dd className="mt-1">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(contact.status)}`}>
                                  {getStatusLabel(contact.status)}
                                </span>
                              </dd>
                            </div>
                          </dl>
                          <div>
                            <dt className="text-xs font-medium text-gray-500 mb-1">メッセージ</dt>
                            <dd className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                              {contact.message || '（なし）'}
                            </dd>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );

                  return [baseRow, expandRow];
                })}
              </tbody>
            </table>
            {filteredContacts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">お問い合わせがありません</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="お問い合わせを削除しますか？"
        description="この操作は取り消せません。"
        confirmLabel="削除する"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

export default function AdminContactsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">読み込み中...</div>}>
      <AdminContactsPageInner />
    </Suspense>
  );
}








