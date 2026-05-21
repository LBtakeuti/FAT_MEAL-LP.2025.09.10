'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Badge, ConfirmDialog, LoadingSpinner, EmptyState, useToast } from '@/components/admin/ui';

interface FaqItem {
  id: string;
  question: string;
  answer_title: string;
  answer_detail: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EditDraft {
  id?: string;
  question: string;
  answer_title: string;
  answer_detail: string;
  is_active: boolean;
}

const EMPTY_DRAFT: EditDraft = {
  question: '',
  answer_title: '',
  answer_detail: '',
  is_active: true,
};

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/faqs');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data?.message || `取得に失敗しました (${res.status})`);
        setFaqs([]);
        return;
      }
      setFaqs(await res.json());
    } catch (e) {
      console.error(e);
      setLoadError('取得に失敗しました');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => setEditingDraft({ ...EMPTY_DRAFT });
  const openEdit = (faq: FaqItem) => setEditingDraft({
    id: faq.id,
    question: faq.question,
    answer_title: faq.answer_title,
    answer_detail: faq.answer_detail,
    is_active: faq.is_active,
  });

  const handleSave = async () => {
    if (!editingDraft) return;
    if (!editingDraft.question.trim() || !editingDraft.answer_title.trim()) {
      toast.error('質問と回答の見出しは必須です');
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!editingDraft.id;
      const url = isEdit ? `/api/admin/faqs/${editingDraft.id}` : '/api/admin/faqs';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: editingDraft.question,
          answer_title: editingDraft.answer_title,
          answer_detail: editingDraft.answer_detail,
          is_active: editingDraft.is_active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success(isEdit ? '更新しました' : '作成しました');
        setEditingDraft(null);
        await load();
      } else {
        toast.error(data?.message || '保存に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (faq: FaqItem) => {
    try {
      const res = await fetch(`/api/admin/faqs/${faq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: faq.question,
          answer_title: faq.answer_title,
          answer_detail: faq.answer_detail,
          is_active: !faq.is_active,
        }),
      });
      if (res.ok) {
        toast.success(faq.is_active ? '非公開にしました' : '公開しました');
        await load();
      } else {
        toast.error('変更に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toast.error('変更に失敗しました');
    }
  };

  const moveItem = async (index: number, dir: -1 | 1) => {
    const target = faqs[index + dir];
    const current = faqs[index];
    if (!target || !current) return;
    try {
      const res = await fetch('/api/admin/faqs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { id: current.id, sort_order: target.sort_order },
            { id: target.id, sort_order: current.sort_order },
          ],
        }),
      });
      if (res.ok) await load();
      else toast.error('並び替えに失敗しました');
    } catch (e) {
      console.error(e);
      toast.error('並び替えに失敗しました');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/faqs/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('削除しました');
        await load();
      } else {
        toast.error('削除に失敗しました');
      }
    } catch (e) {
      console.error(e);
      toast.error('削除に失敗しました');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">FAQ管理</h1>
          <Button onClick={openCreate}>新規作成</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">並び</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">質問</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">回答見出し</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">公開</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faqs.map((faq, index) => (
                <tr key={faq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-col gap-1 items-start">
                      <button
                        onClick={() => moveItem(index, -1)}
                        disabled={index === 0}
                        className="text-xs px-1.5 py-0.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="上に移動"
                      >▲</button>
                      <button
                        onClick={() => moveItem(index, 1)}
                        disabled={index === faqs.length - 1}
                        className="text-xs px-1.5 py-0.5 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="下に移動"
                      >▼</button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-medium line-clamp-2 max-w-md">{faq.question}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="line-clamp-2 max-w-md">{faq.answer_title}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => toggleActive(faq)} className="cursor-pointer">
                      <Badge variant={faq.is_active ? 'success' : 'neutral'}>
                        {faq.is_active ? '公開' : '非公開'}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(faq)}>編集</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteTarget(faq)}>削除</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {faqs.length === 0 && !loadError && (
            <EmptyState message="FAQがありません" description="「新規作成」から追加できます" />
          )}
          {loadError && (
            <div className="p-6 text-center">
              <p className="text-red-600 text-sm mb-3">{loadError}</p>
              <Button variant="secondary" onClick={load}>再読み込み</Button>
            </div>
          )}
        </div>
      </div>

      {/* 編集モーダル */}
      {editingDraft && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingDraft.id ? 'FAQを編集' : '新しいFAQを作成'}
              </h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  質問 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingDraft.question}
                  onChange={(e) => setEditingDraft({ ...editingDraft, question: e.target.value })}
                  maxLength={200}
                  placeholder="例: ふとるめしを冷凍庫から取り出した後、すぐに食べられますか？"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  回答見出し <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-2">（オレンジ色で強調表示される短文）</span>
                </label>
                <input
                  type="text"
                  value={editingDraft.answer_title}
                  onChange={(e) => setEditingDraft({ ...editingDraft, answer_title: e.target.value })}
                  maxLength={200}
                  placeholder="例: 電子レンジで温めるだけで召し上がれます。"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  詳細説明
                  <span className="text-xs text-gray-400 ml-2">（任意・回答見出しの下に補足として表示）</span>
                </label>
                <textarea
                  value={editingDraft.answer_detail}
                  onChange={(e) => setEditingDraft({ ...editingDraft, answer_detail: e.target.value })}
                  maxLength={4000}
                  rows={5}
                  placeholder="補足説明・条件・例外などを入力できます"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editingDraft.is_active}
                    onChange={(e) => setEditingDraft({ ...editingDraft, is_active: e.target.checked })}
                    className="w-4 h-4 accent-orange-600"
                  />
                  公開する
                </label>
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
              <Button variant="secondary" onClick={() => setEditingDraft(null)} disabled={saving}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="FAQを削除しますか？"
        description={deleteTarget ? `「${deleteTarget.question.slice(0, 50)}${deleteTarget.question.length > 50 ? '...' : ''}」を削除します。` : undefined}
        confirmLabel="削除する"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
