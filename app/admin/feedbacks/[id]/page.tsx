'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';

export default function EditFeedbackPage({ params: promiseParams }: { params: Promise<{ id: string }> }) {
  const params = use(promiseParams);
  const router = useRouter();
  const [formData, setFormData] = useState({
    thumbnail_image: '',
    thumbnail_label: '',
    date: '',
    title: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [showThumbnailUrlInput, setShowThumbnailUrlInput] = useState(false);
  const [thumbnailUrlInput, setThumbnailUrlInput] = useState('');

  const fetchFeedback = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/feedbacks/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          thumbnail_image: data.thumbnail_image || '',
          thumbnail_label: data.thumbnail_label || '',
          date: data.date || '',
          title: data.title || '',
          description: data.description || '',
          sort_order: data.sort_order ?? 0,
          is_active: data.is_active ?? true,
        });
      } else {
        alert('フィードバックの取得に失敗しました');
        router.push('/admin/feedbacks');
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      router.push('/admin/feedbacks');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleUpload = async (
    file: File,
    field: 'thumbnail_image',
    setUploading: (v: boolean) => void
  ) => {
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('bucket', 'images');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (response.ok) {
        const { url } = await response.json();
        setFormData((prev) => ({ ...prev, [field]: url }));
      } else {
        alert('画像のアップロードに失敗しました');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('画像のアップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/feedbacks/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/feedbacks');
      } else {
        const data = await response.json();
        alert(data.message || '更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
      alert('エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? parseInt(value, 10) || 0
          : value,
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">フィードバック編集</h1>
            <button
              type="button"
              onClick={() => router.push('/admin/feedbacks')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              一覧に戻る
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* サムネイル画像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                サムネイル画像 <span className="text-red-500">*</span>
              </label>
              {formData.thumbnail_image && (
                <div className="mt-2 mb-3">
                  <img
                    src={formData.thumbnail_image}
                    alt="サムネイルプレビュー"
                    className="w-40 h-24 object-cover rounded"
                  />
                  <div className="mt-1">
                    <p className="text-xs text-gray-500">現在の画像:</p>
                    <a
                      href={formData.thumbnail_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {formData.thumbnail_image}
                    </a>
                  </div>
                </div>
              )}
              <div className="mt-1 space-y-3">
                {/* ファイルアップロード or URL入力の切り替え */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowThumbnailUrlInput(false)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      !showThumbnailUrlInput
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    ファイルアップロード
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowThumbnailUrlInput(true)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      showThumbnailUrlInput
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    URLを入力
                  </button>
                </div>

                {!showThumbnailUrlInput ? (
                  /* ファイルアップロード */
                  <>
                    <label className="block w-full cursor-pointer">
                      <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                        {formData.thumbnail_image ? '画像を変更' : 'ファイルを選択'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(file, 'thumbnail_image', setUploadingThumbnail);
                        }}
                        className="sr-only"
                        disabled={uploadingThumbnail}
                      />
                    </label>
                    {uploadingThumbnail && <p className="mt-2 text-sm text-gray-500">アップロード中...</p>}
                  </>
                ) : (
                  /* URL入力 */
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={thumbnailUrlInput}
                      onChange={(e) => setThumbnailUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (thumbnailUrlInput) {
                          setFormData({ ...formData, thumbnail_image: thumbnailUrlInput });
                          setThumbnailUrlInput('');
                        }
                      }}
                      className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                      URLを設定
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* サムネイルラベル */}
            <div>
              <label htmlFor="thumbnail_label" className="block text-sm font-medium text-gray-700">
                サムネイルラベル
              </label>
              <input
                type="text"
                id="thumbnail_label"
                name="thumbnail_label"
                value={formData.thumbnail_label}
                onChange={handleChange}
                placeholder="例: NEW, 改善済み"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            {/* 日付 */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                日付 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>

            {/* タイトル */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                タイトル <span className="text-red-500">*</span>
                <span className="text-gray-400 text-xs ml-2">（最大50文字）</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                maxLength={50}
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">{formData.title.length}/50</p>
            </div>

            {/* 説明文 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                説明文 <span className="text-red-500">*</span>
                <span className={`text-xs ml-2 ${formData.description.length > 70 ? 'text-red-500' : 'text-gray-400'}`}>
                  （{formData.description.length}/70文字）
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                フロント表示は3行まで（1行約20-25文字）
              </p>
              <textarea
                id="description"
                name="description"
                required
                maxLength={70}
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">{formData.description.length}/200</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 表示順 */}
              <div>
                <label htmlFor="sort_order" className="block text-sm font-medium text-gray-700">
                  表示順
                </label>
                <input
                  type="number"
                  id="sort_order"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                />
              </div>

              {/* 有効/無効 */}
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  有効（公開する）
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => router.push('/admin/feedbacks')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.thumbnail_image}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
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
