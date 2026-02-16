'use client';

import { useState, useEffect, useCallback } from 'react';

interface Referrer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  referral_code: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  referral_code: string;
}

interface MonthlyStats {
  month: string;
  count: number;
  totalCommission: number;
  initialCommission: number;
  recurringCommission: number;
  byProduct: { [key: string]: { count: number; commission: number } };
}

interface ReferrerStats {
  referral_code: string;
  totalCount: number;
  totalCommission: number;
  paidCommission: number;
  unpaidCommission: number;
  initialCommission: number;
  recurringCommission: number;
  monthlyStats: MonthlyStats[];
  byProduct: { [key: string]: { count: number; commission: number } };
}

interface PayoutRecord {
  id: string;
  referrer_code: string;
  amount: number;
  note: string | null;
  paid_at: string;
  created_at: string;
}

export default function ReferrersPage() {
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [stats, setStats] = useState<ReferrerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // モーダル
  const [showModal, setShowModal] = useState(false);
  const [editingReferrer, setEditingReferrer] = useState<Referrer | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    referral_code: '',
  });
  const [submitting, setSubmitting] = useState(false);
  
  // 統計詳細モーダル
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedReferrer, setSelectedReferrer] = useState<Referrer | null>(null);
  const [selectedStats, setSelectedStats] = useState<ReferrerStats | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRecord[]>([]);
  const [processingPayout, setProcessingPayout] = useState(false);

  const fetchReferrers = useCallback(async () => {
    try {
      setLoading(true);
      const [referrersRes, statsRes] = await Promise.all([
        fetch('/api/admin/referrers'),
        fetch('/api/admin/referrers/stats'),
      ]);
      
      if (!referrersRes.ok) throw new Error('Failed to fetch referrers');
      const referrersData = await referrersRes.json();
      setReferrers(referrersData);
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      setError('紹介者の取得に失敗しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrers();
  }, [fetchReferrers]);

  // 紹介コードの統計を取得
  const getStatsForCode = (code: string): ReferrerStats | undefined => {
    return stats.find(s => s.referral_code === code);
  };

  const openCreateModal = () => {
    setEditingReferrer(null);
    setFormData({ name: '', email: '', phone: '', notes: '', referral_code: '' });
    setShowModal(true);
  };

  const openEditModal = (referrer: Referrer) => {
    setEditingReferrer(referrer);
    setFormData({
      name: referrer.name,
      email: referrer.email || '',
      phone: referrer.phone || '',
      notes: referrer.notes || '',
      referral_code: referrer.referral_code,
    });
    setShowModal(true);
  };

  const openStatsModal = async (referrer: Referrer) => {
    setSelectedReferrer(referrer);
    setSelectedStats(getStatsForCode(referrer.referral_code) || null);
    setShowStatsModal(true);

    // 支払い履歴を取得
    try {
      const res = await fetch(`/api/admin/referrers/payouts?code=${referrer.referral_code}`);
      if (res.ok) {
        const data = await res.json();
        setPayoutHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch payout history:', err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingReferrer(null);
    setFormData({ name: '', email: '', phone: '', notes: '', referral_code: '' });
  };

  const closeStatsModal = () => {
    setShowStatsModal(false);
    setSelectedReferrer(null);
    setSelectedStats(null);
    setPayoutHistory([]);
  };

  const handleProcessPayout = async (referrer: Referrer, stats: ReferrerStats) => {
    const unpaidAmount = stats.unpaidCommission;

    if (unpaidAmount <= 0) {
      alert('未払いのコミッションがありません');
      return;
    }

    if (!confirm(`${referrer.name} に ${formatAmount(unpaidAmount)} を支払い処理しますか？`)) {
      return;
    }

    setProcessingPayout(true);
    try {
      const res = await fetch('/api/admin/referrers/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrer_code: referrer.referral_code,
          amount: unpaidAmount,
          note: `${referrer.name} への支払い`,
        }),
      });

      if (!res.ok) throw new Error('Failed to process payout');

      alert('支払い処理が完了しました');

      // データを再取得
      await fetchReferrers();

      // モーダルが開いている場合は再読み込み
      if (showStatsModal && selectedReferrer) {
        const updatedStats = getStatsForCode(selectedReferrer.referral_code);
        setSelectedStats(updatedStats || null);

        const payoutRes = await fetch(`/api/admin/referrers/payouts?code=${selectedReferrer.referral_code}`);
        if (payoutRes.ok) {
          const data = await payoutRes.json();
          setPayoutHistory(data);
        }
      }
    } catch (err) {
      alert('支払い処理に失敗しました');
      console.error(err);
    } finally {
      setProcessingPayout(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('紹介者名を入力してください');
      return;
    }

    setSubmitting(true);
    try {
      if (editingReferrer) {
        const res = await fetch(`/api/admin/referrers/${editingReferrer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to update');
      } else {
        const res = await fetch('/api/admin/referrers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) throw new Error('Failed to create');
      }
      
      closeModal();
      fetchReferrers();
    } catch (err) {
      alert('保存に失敗しました');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (referrer: Referrer) => {
    try {
      const res = await fetch(`/api/admin/referrers/${referrer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...referrer,
          is_active: !referrer.is_active,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchReferrers();
    } catch (err) {
      alert('ステータス変更に失敗しました');
      console.error(err);
    }
  };

  const handleDelete = async (referrer: Referrer) => {
    if (!confirm(`「${referrer.name}」を削除しますか？\n紹介リンク: https://www.futorumeshi.com/purchase?ref=${referrer.referral_code}`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/referrers/${referrer.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      fetchReferrers();
    } catch (err) {
      alert('削除に失敗しました');
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('クリップボードにコピーしました');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}年${month}月`;
  };

  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">紹介者管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            リンク用コードは任意で指定可能（未入力の場合は自動生成）
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規登録
        </button>
      </div>

      {/* 一覧テーブル */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {referrers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            紹介者がまだ登録されていません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    紹介者名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    紹介リンク
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    利用回数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    未払いコミッション
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支払い累計額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    登録日
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrers.map((referrer) => {
                  const referrerStats = getStatsForCode(referrer.referral_code);
                  return (
                    <tr key={referrer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{referrer.name}</div>
                        {referrer.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-[200px]">
                            {referrer.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 truncate max-w-[200px]" title={`https://www.futorumeshi.com/purchase?ref=${referrer.referral_code}`}>
                            ...?ref={referrer.referral_code}
                          </span>
                          <button
                            onClick={() => copyToClipboard(`https://www.futorumeshi.com/purchase?ref=${referrer.referral_code}`)}
                            className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            title="リンクをコピー"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openStatsModal(referrer)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {referrerStats?.totalCount || 0}回
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 font-medium">
                            {formatAmount(referrerStats?.unpaidCommission || 0)}
                          </span>
                          {referrerStats && referrerStats.unpaidCommission > 0 && (
                            <button
                              onClick={() => handleProcessPayout(referrer, referrerStats)}
                              disabled={processingPayout}
                              className="px-2 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                              title="支払い処理"
                            >
                              支払い
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatAmount(referrerStats?.paidCommission || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(referrer)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            referrer.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {referrer.is_active ? '有効' : '無効'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(referrer.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          onClick={() => openStatsModal(referrer)}
                          className="text-green-600 hover:text-green-800 mr-3"
                        >
                          統計
                        </button>
                        <button
                          onClick={() => openEditModal(referrer)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(referrer)}
                          className="text-red-600 hover:text-red-800"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 登録・編集モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingReferrer ? '紹介者を編集' : '紹介者を登録'}
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    紹介者名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="例: 山田 太郎"
                    required
                  />
                </div>
                {!editingReferrer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      リンク用コード（任意）
                    </label>
                    <input
                      type="text"
                      value={formData.referral_code}
                      onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono uppercase"
                      placeholder="例: YAMADA2025（未入力で自動生成）"
                      maxLength={12}
                    />
                    <p className="text-xs text-gray-500 mt-1">紹介リンクの ?ref= に使われるコード。大文字英字と数字のみ、4〜12文字</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="example@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="090-1234-5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メモ
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="任意のメモ"
                  />
                </div>
                {editingReferrer && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      紹介リンク: <code className="font-mono text-xs break-all">https://www.futorumeshi.com/purchase?ref={editingReferrer.referral_code}</code>
                    </p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 統計詳細モーダル */}
      {showStatsModal && selectedReferrer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {selectedReferrer.name} の利用統計
                </h2>
                <p className="text-sm text-gray-500">
                  紹介リンク: <code className="font-mono text-xs">https://www.futorumeshi.com/purchase?ref={selectedReferrer.referral_code}</code>
                </p>
              </div>
              <button
                onClick={closeStatsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {!selectedStats || selectedStats.totalCount === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  まだこの紹介コードは使用されていません
                </div>
              ) : (
                <div className="space-y-6">
                  {/* サマリー */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">合計利用回数</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedStats.totalCount}回</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">紹介料合計</p>
                      <p className="text-2xl font-bold text-green-900">{formatAmount(selectedStats.totalCommission)}</p>
                      {(selectedStats.initialCommission > 0 || selectedStats.recurringCommission > 0) && (
                        <div className="mt-1 text-xs text-green-700 space-y-0.5">
                          <div>初回: {formatAmount(selectedStats.initialCommission)}</div>
                          <div>継続: {formatAmount(selectedStats.recurringCommission)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 支払い状況 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 rounded-lg p-4 border-2 border-orange-200">
                      <p className="text-sm text-orange-600 font-medium">未払いコミッション</p>
                      <p className="text-2xl font-bold text-orange-900">{formatAmount(selectedStats.unpaidCommission)}</p>
                      {selectedStats.unpaidCommission > 0 && selectedReferrer && (
                        <button
                          onClick={() => handleProcessPayout(selectedReferrer, selectedStats)}
                          disabled={processingPayout}
                          className="mt-2 w-full px-3 py-1.5 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          {processingPayout ? '処理中...' : '支払い処理'}
                        </button>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium">支払い累計額</p>
                      <p className="text-2xl font-bold text-gray-900">{formatAmount(selectedStats.paidCommission)}</p>
                      <p className="text-xs text-gray-500 mt-1">支払い回数: {payoutHistory.length}回</p>
                    </div>
                  </div>

                  {/* 紹介料単価の説明 */}
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-orange-800 mb-2">紹介料レート</h3>
                    <table className="w-full text-sm text-orange-700">
                      <thead>
                        <tr className="border-b border-orange-200">
                          <th className="text-left py-1">プラン</th>
                          <th className="text-right py-1">初回</th>
                          <th className="text-right py-1">継続/月</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td className="py-0.5">お試しプラン</td><td className="text-right">¥500</td><td className="text-right text-orange-400">-</td></tr>
                        <tr><td className="py-0.5">6食定期プラン</td><td className="text-right">¥1,000</td><td className="text-right">¥300</td></tr>
                        <tr><td className="py-0.5">12食定期プラン</td><td className="text-right">¥2,000</td><td className="text-right">¥500</td></tr>
                        <tr><td className="py-0.5">24食定期プラン</td><td className="text-right">¥4,000</td><td className="text-right">¥800</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 商品別内訳 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">商品別内訳</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        {Object.entries(selectedStats.byProduct).map(([product, data]) => (
                          <div key={product} className="flex justify-between items-center">
                            <span className="text-gray-700">{product}</span>
                            <div className="text-right">
                              <span className="font-medium text-gray-900">{data.count}回</span>
                              <span className="text-gray-500 ml-2">({formatAmount(data.commission)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 月別推移 */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">月別推移</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">月</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">回数</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">紹介料</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">初回</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">継続</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">商品内訳</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedStats.monthlyStats.map((month) => (
                            <tr key={month.month}>
                              <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                {formatMonth(month.month)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                {month.count}回
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                {formatAmount(month.totalCommission)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                {formatAmount(month.initialCommission || 0)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                {formatAmount(month.recurringCommission || 0)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">
                                {Object.entries(month.byProduct).map(([product, data]) => (
                                  <span key={product} className="mr-2">
                                    {product}: {data.count}回
                                  </span>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 支払い履歴 */}
                  {payoutHistory.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">支払い履歴</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">支払日</th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">メモ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {payoutHistory.map((payout) => (
                              <tr key={payout.id}>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {formatDate(payout.paid_at)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                  {formatAmount(payout.amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {payout.note || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeStatsModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
