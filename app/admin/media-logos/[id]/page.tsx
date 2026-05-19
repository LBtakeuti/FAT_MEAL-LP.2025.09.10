'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/admin/ui';

export default function EditMediaLogoPage({ params: promiseParams }: { params: Promise<{ id: string }> }) {
  const toast = useToast();
  const params = use(promiseParams);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchLogo = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/media-logos/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          image_url: data.image_url || '',
          sort_order: data.sort_order ?? 0,
          is_active: data.is_active ?? true,
        });
      } else {
        toast.error('データの取得に失敗しました');
        router.push('/admin/media-logos');
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
      router.push('/admin/media-logos');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchLogo();
  }, [fetchLogo]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const response = await fetch('/api/admin/media-logos/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setFormData((prev) => ({ ...prev, image_url: url }));
      } else {
        toast.error('画像のアップロードに失敗しました');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/media-logos/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        router.push('/admin/media-logos');
      } else {
        const data = await response.json();
        toast.error(data.message || '更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update:', error);
      toast.error('エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">メディアロゴ編集</h1>
            <button
              type="button"
              onClick={() => router.push('/admin/media-logos')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              一覧に戻る
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* ロゴ画像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ロゴ画像 <span className="text-red-500">*</span>
                <span className="text-gray-400 text-xs ml-2">（WebPに自動変換されます）</span>
              </label>
              {formData.image_url && (
                <div className="mt-2 mb-3 p-3 bg-gray-50 rounded-lg inline-block">
                  <img src={formData.image_url} alt="現在のロゴ" className="h-16 w-auto object-contain" />
                </div>
              )}
              <div className="mt-1">
                <label className="block w-full cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    {formData.image_url ? '画像を変更' : 'ファイルを選択'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file);
                    }}
                    className="sr-only"
                    disabled={uploading}
                  />
                </label>
                {uploading && <p className="mt-2 text-sm text-gray-500">アップロード・変換中...</p>}
              </div>
            </div>

            {/* メディア名 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                メディア名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            {/* 表示順・有効 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700">表示順</label>
                <input
                  type="number"
                  id="sort_order"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">有効（表示する）</label>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => router.push('/admin/media-logos')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.image_url || !formData.name}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
              >
                {submitting ? '更新中...' : '更新'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
