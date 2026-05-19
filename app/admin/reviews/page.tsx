'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { REVIEW_ICON_PRESETS, presetToUrl, type ReviewIconPreset, type ReviewItemAdmin } from '@/types/review';
import { ConfirmDialog, useToast } from '@/components/admin/ui';

const PRESET_LABEL: Record<ReviewIconPreset, string> = {
  woman_1blue: '女性 1（ブルー）',
  woman_2gray: '女性 2（グレー）',
  woman_3blue: '女性 3（ブルー）',
  woman_3pink: '女性 3（ピンク）',
  woman_3yellow: '女性 3（イエロー）',
  man_2: '男性 2',
  man_3blue: '男性 3（ブルー）',
  man_3blue2: '男性 3（ブルー2）',
  man_3pink: '男性 3（ピンク）',
  man_3red: '男性 3（レッド）',
};

interface FormState {
  id: string | null;
  iconMode: 'preset' | 'upload';
  icon_url: string;
  icon_preset: ReviewIconPreset;
  name: string;
  comment: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  id: null,
  iconMode: 'preset',
  icon_url: '',
  icon_preset: 'woman_1blue',
  name: '',
  comment: '',
  rating: 5,
  sort_order: 0,
  is_active: true,
};

export default function AdminReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<ReviewItemAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewItemAdmin | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, sort_order: (reviews[reviews.length - 1]?.sort_order ?? 0) + 10 });
    setModalOpen(true);
  };

  const openEdit = (item: ReviewItemAdmin) => {
    setForm({
      id: item.id,
      iconMode: item.icon_url ? 'upload' : 'preset',
      icon_url: item.icon_url || '',
      icon_preset: item.icon_preset || 'woman_1blue',
      name: item.name,
      comment: item.comment,
      rating: item.rating,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'review-images');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'アップロードに失敗しました');
        return;
      }
      const data = await res.json();
      setForm((prev) => ({ ...prev, icon_url: data.url, iconMode: 'upload' }));
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('アップロードに失敗しました');
    } finally {
      setUploadingIcon(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.comment.trim()) {
      toast.error('名前とコメントは必須です');
      return;
    }
    if (form.iconMode === 'upload' && !form.icon_url) {
      toast.error('画像をアップロードしてください');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        icon_url: form.iconMode === 'upload' ? form.icon_url : null,
        icon_preset: form.iconMode === 'preset' ? form.icon_preset : null,
        name: form.name.trim(),
        comment: form.comment.trim(),
        rating: form.rating,
        sort_order: form.sort_order,
        is_active: form.is_active,
      };

      const url = form.id ? `/api/admin/reviews/${form.id}` : '/api/admin/reviews';
      const method = form.id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || '保存に失敗しました');
        return;
      }

      await fetchReviews();
      setModalOpen(false);
    } catch (err) {
      console.error('Save error:', err);
      toast.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: ReviewItemAdmin) => setDeleteTarget(item);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('削除しました');
        fetchReviews();
      } else {
        toast.error('削除に失敗しました');
      }
    } catch {
      toast.error('削除に失敗しました');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleToggleActive = async (item: ReviewItemAdmin) => {
    const res = await fetch(`/api/admin/reviews/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, is_active: !item.is_active }),
    });
    if (res.ok) fetchReviews();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">レビュー管理</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
        >
          ＋ 新規追加
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">並び順</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">アバター</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">名前</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">星</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">コメント</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">表示</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">読み込み中...</td></tr>
            ) : reviews.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">レビューがまだ登録されていません</td></tr>
            ) : reviews.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.sort_order}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <AvatarPreview item={item} size={40} />
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                  <span className="text-yellow-500">{'★'.repeat(item.rating)}</span>
                  <span className="text-gray-300">{'★'.repeat(5 - item.rating)}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{item.comment}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {item.is_active ? '表示中' : '非表示'}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <button onClick={() => openEdit(item)} className="text-orange-600 hover:text-orange-800 font-medium mr-3">編集</button>
                  <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800 font-medium">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モーダル */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{form.id ? 'レビュー編集' : 'レビュー新規追加'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-5">
              {/* アイコンモード切替 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">アバター</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, iconMode: 'preset' }))}
                    className={`px-3 py-1.5 rounded text-sm ${form.iconMode === 'preset' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    プリセットから選択
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, iconMode: 'upload' }))}
                    className={`px-3 py-1.5 rounded text-sm ${form.iconMode === 'upload' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    画像アップロード
                  </button>
                </div>

                {form.iconMode === 'preset' ? (
                  <div className="grid grid-cols-5 gap-3">
                    {REVIEW_ICON_PRESETS.map((preset) => {
                      const selected = form.icon_preset === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, icon_preset: preset }))}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                            selected ? 'border-orange-600 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          title={PRESET_LABEL[preset]}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={presetToUrl(preset)} alt={PRESET_LABEL[preset]} className="w-12 h-12 object-contain" />
                          <span className="text-[10px] text-gray-500 text-center leading-tight">{PRESET_LABEL[preset]}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <PreviewAvatar mode="upload" preset={form.icon_preset} url={form.icon_url || null} />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      disabled={uploadingIcon}
                      className="text-sm"
                    />
                    {uploadingIcon && <span className="text-xs text-gray-500">アップロード中…</span>}
                  </div>
                )}
              </div>

              {/* 名前 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名前 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  maxLength={30}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="例: 山田 太郎 / Tさん"
                />
              </div>

              {/* 星評価 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">星評価 <span className="text-red-500">*</span></label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, rating: n }))}
                      className={`text-3xl transition-colors ${n <= form.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ml-2 self-center text-sm text-gray-500">{form.rating} / 5</span>
                </div>
              </div>

              {/* コメント */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">コメント <span className="text-red-500">*</span></label>
                <textarea
                  value={form.comment}
                  maxLength={200}
                  rows={4}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="お客様の声を入力（最大200文字）"
                />
                <div className="text-xs text-gray-400 text-right mt-1">{form.comment.length} / 200</div>
              </div>

              {/* 並び順 + 表示 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">並び順</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">数値が小さいほど先頭に表示</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">表示</label>
                  <label className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 rounded"
                    />
                    <span className="text-sm text-gray-700">フロントに表示する</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={closeModal} disabled={saving} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">キャンセル</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50">
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="レビューを削除しますか？"
        description={deleteTarget ? `「${deleteTarget.name}」のレビューを削除します。この操作は取り消せません。` : undefined}
        confirmLabel="削除する"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// 一覧用アバター
function AvatarPreview({ item, size }: { item: ReviewItemAdmin; size: number }) {
  const url = item.icon_url || (item.icon_preset ? presetToUrl(item.icon_preset) : null);
  if (!url) {
    return <div className="rounded-full bg-gray-100" style={{ width: size, height: size }} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={item.name} style={{ width: size, height: size }} className="rounded-full object-cover bg-gray-50" />
  );
}

// モーダル内アップロードプレビュー
function PreviewAvatar({ mode, preset, url }: { mode: 'preset' | 'upload'; preset: ReviewIconPreset; url: string | null }) {
  const size = 56;
  const src = mode === 'upload' ? url : presetToUrl(preset);
  if (mode === 'upload' && !url) {
    return (
      <div className="rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs border" style={{ width: size, height: size }}>
        画像なし
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src!} alt="preview" style={{ width: size, height: size }} className="rounded-full object-cover border bg-gray-50" />
  );
}
