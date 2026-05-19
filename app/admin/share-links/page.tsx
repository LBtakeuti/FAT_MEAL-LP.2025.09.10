'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Badge, ConfirmDialog, LoadingSpinner, EmptyState, useToast } from '@/components/admin/ui';

interface ShareLinkRow {
  id: string;
  slug: string;
  label: string | null;
  expires_at: string | null;
  created_at: string;
  photo_count: number;
  access_count: number;
  unique_access_count: number;
  download_count: number;
}

export default function AdminShareLinksPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ShareLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; label: string | null } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/share-links');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data?.message || `取得に失敗しました (${res.status})`);
        setRows([]);
        return;
      }
      setRows(await res.json());
    } catch (e) {
      console.error(e);
      setLoadError('取得に失敗しました');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 「新規作成」: 空の record を作って即詳細ページへ遷移。
  // 詳細ページで label / タイトル / 本文 / 写真 / 有効期限 を1画面で設定できる。
  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.slug) {
        router.push(`/admin/share-links/${data.slug}`);
      } else {
        toast.error(data?.message || '作成に失敗しました');
        setCreating(false);
      }
    } catch (e) {
      console.error(e);
      toast.error('作成に失敗しました');
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/share-links/${deleteTarget.slug}`, { method: 'DELETE' });
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

  const copyShareUrl = async (slug: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${base}/share/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      toast.success('URLをコピーしました');
      setTimeout(() => setCopiedSlug((s) => (s === slug ? null : s)), 2000);
    } catch {
      toast.error('コピーに失敗しました');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">個別メッセージ管理</h1>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? '作成中...' : '新規作成'}
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ラベル</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作成日</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有効期限</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">写真</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">流入数</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ユニークアクセス</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">DL</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row) => {
                const expired = row.expires_at ? new Date(row.expires_at).getTime() < Date.now() : false;
                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{row.label || <span className="text-gray-400">（無題）</span>}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/share/${row.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-orange-600 hover:underline"
                        >
                          /share/{row.slug}
                        </a>
                        <button
                          type="button"
                          onClick={() => copyShareUrl(row.slug)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          {copiedSlug === row.slug ? 'コピー済み' : 'コピー'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(row.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {row.expires_at ? (
                        <span className={expired ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {new Date(row.expires_at).toLocaleDateString('ja-JP')}
                          {expired && <Badge variant="danger" className="ml-2">期限切れ</Badge>}
                        </span>
                      ) : (
                        <span className="text-gray-400">無期限</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums">{row.photo_count}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums">{row.access_count}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums">{row.unique_access_count}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums">{row.download_count}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link href={`/admin/share-links/${row.slug}`}>
                        <Button size="sm" variant="secondary">編集</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteTarget({ slug: row.slug, label: row.label })}
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && !loadError && (
            <EmptyState
              message="個別メッセージがありません"
              description="「新規作成」から作成できます"
            />
          )}
          {loadError && (
            <div className="p-6 text-center">
              <p className="text-red-600 text-sm mb-3">{loadError}</p>
              <Button variant="secondary" onClick={load}>再読み込み</Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="個別メッセージを削除しますか？"
        description={
          deleteTarget
            ? `「${deleteTarget.label || '（無題）'}」を削除します。\n紐づく写真とアクセス・ダウンロードログもすべて削除されます。`
            : undefined
        }
        confirmLabel="削除する"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
