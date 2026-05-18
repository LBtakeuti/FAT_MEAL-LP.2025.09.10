'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Badge, ConfirmDialog, LoadingSpinner, EmptyState, useToast } from '@/components/admin/ui';

interface AmbassadorItem {
  id: string;
  thumbnail_image: string;
  thumbnail_label: string | null;
  icon_image: string;
  department: string | null;
  date: string;
  title: string;
  description: string;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  referrer_id: string | null;
  promoter_page_id: string | null;
  referrer?: { id: string; name: string; referral_code: string; is_active: boolean } | null;
  promoter_page?: { id: string; slug: string; title: string | null; is_active: boolean } | null;
}

interface CommissionRow { referral_code: string; commission_amount: number; }
interface PayoutRow { referrer_code: string; amount: number; }
interface ConvRow { promoter_page_id: string; amount: number; }

export default function AdminAmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<AmbassadorItem[]>([]);
  const [loading, setLoading] = useState(true);
  // referral_code → 集計
  const [commissionByCode, setCommissionByCode] = useState<Record<string, number>>({});
  const [payoutByCode, setPayoutByCode] = useState<Record<string, number>>({});
  // promoter_page_id → 集計
  const [convByPage, setConvByPage] = useState<Record<string, { count: number; amount: number }>>({});

  useEffect(() => {
    fetchAmbassadors();
  }, []);

  const fetchAmbassadors = async () => {
    try {
      const response = await fetch('/api/admin/ambassadors');
      if (response.ok) {
        const data = await response.json();
        setAmbassadors(data);
        // 紐付き referrer の集計を取得
        const codes = data
          .map((a: AmbassadorItem) => a.referrer?.referral_code)
          .filter((c: string | undefined): c is string => !!c);
        if (codes.length > 0) {
          // referrer_commissions と payouts は admin/referrers/stats が code 別に集計済みを返す
          // ここでは pages 一覧経由で集計する代わりに、各 code ごとに stats を呼ぶのは N+1 になるため、
          // 代わりに簡易的に referrers stats API を一括取得する（codeなし全件返却）
          fetch('/api/admin/referrers/stats')
            .then((r) => r.ok ? r.json() : [])
            .then((stats: Array<{ referral_code: string; totalCommission: number; paidCommission: number }>) => {
              const c: Record<string, number> = {};
              const p: Record<string, number> = {};
              for (const s of stats || []) {
                c[s.referral_code] = s.totalCommission || 0;
                p[s.referral_code] = s.paidCommission || 0;
              }
              setCommissionByCode(c);
              setPayoutByCode(p);
            });
        }
        // 紐付き promoter_page の集計（list API が conversion_count/amount を返してくれる）
        fetch('/api/admin/promoter-pages')
          .then((r) => r.ok ? r.json() : [])
          .then((pages: Array<{ id: string; conversion_count?: number; conversion_amount?: number }>) => {
            const m: Record<string, { count: number; amount: number }> = {};
            for (const p of pages || []) {
              m[p.id] = { count: p.conversion_count || 0, amount: p.conversion_amount || 0 };
            }
            setConvByPage(m);
          });
      }
    } catch (error) {
      console.error('Failed to fetch ambassadors:', error);
    } finally {
      setLoading(false);
    }
  };

  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = (item: AmbassadorItem) => {
    setDeleteTarget({ id: item.id, title: item.title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/ambassadors/${deleteTarget.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('削除しました');
        fetchAmbassadors();
      } else {
        toast.error('削除に失敗しました');
      }
    } catch (error) {
      console.error('Failed to delete ambassador:', error);
      toast.error('削除に失敗しました');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (item: AmbassadorItem) => {
    try {
      const response = await fetch(`/api/admin/ambassadors/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          is_active: !item.is_active,
        }),
      });
      if (response.ok) {
        toast.success(item.is_active ? '非公開にしました' : '公開しました');
        fetchAmbassadors();
      } else {
        toast.error('変更に失敗しました');
      }
    } catch (error) {
      console.error('Failed to toggle ambassador:', error);
      toast.error('変更に失敗しました');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // 旧コラボ告知レコード（紹介コードもLPも紐付かない）は管理画面に出さない
  const visibleAmbassadors = ambassadors.filter(
    (item) => item.referrer_id || item.promoter_page_id
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">アンバサダー管理</h1>
            <Link
              href="/admin/ambassadors/new"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              新規作成
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">サムネイル</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">紹介コード</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">専用LP</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">報酬合計</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">未払い</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">LP購入</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">公開</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleAmbassadors.map((item) => {
                  const code = item.referrer?.referral_code || '';
                  const total = code ? (commissionByCode[code] || 0) : 0;
                  const paid = code ? (payoutByCode[code] || 0) : 0;
                  const unpaid = Math.max(0, total - paid);
                  const conv = item.promoter_page_id ? convByPage[item.promoter_page_id] : null;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.thumbnail_image} alt={item.title} className="w-14 h-9 object-cover rounded" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.date} / 順位 {item.sort_order ?? 0}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {item.referrer ? (
                          <span className="font-mono text-gray-700">{item.referrer.referral_code}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {item.promoter_page ? (
                          <a href={`/p/${item.promoter_page.slug}`} target="_blank" rel="noopener noreferrer" className="font-mono text-orange-600 hover:underline">
                            /p/{item.promoter_page.slug}
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums">
                        {item.referrer ? `¥${total.toLocaleString()}` : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums">
                        {item.referrer ? (
                          <span className={unpaid > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>¥{unpaid.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm tabular-nums">
                        {item.promoter_page ? (
                          <>{conv?.count || 0} 件 <span className="text-xs text-gray-500">/ ¥{(conv?.amount || 0).toLocaleString()}</span></>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button onClick={() => handleToggleActive(item)} className="cursor-pointer">
                          <Badge variant={item.is_active ? 'success' : 'neutral'}>
                            {item.is_active ? '公開' : '非公開'}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Link href={`/admin/ambassadors/${item.id}`} className="inline-block">
                          <Button size="sm" variant="secondary">編集</Button>
                        </Link>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(item)}>削除</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleAmbassadors.length === 0 && (
              <EmptyState message="アンバサダーがありません" description="「新規作成」から登録できます" />
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="アンバサダーを削除しますか？"
        description={deleteTarget ? `「${deleteTarget.title}」を削除します。\n紐付き紹介者・LPはそのまま残ります（紐付けだけ消えます）。` : undefined}
        confirmLabel="削除する"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
