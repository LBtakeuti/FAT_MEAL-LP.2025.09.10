'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewAmbassadorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    thumbnail_image: '',
    thumbnail_label: '',
    icon_image: '',
    department: '',
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [thumbnailFileName, setThumbnailFileName] = useState('');
  const [iconFileName, setIconFileName] = useState('');

  const handleUpload = async (
    file: File,
    field: 'thumbnail_image' | 'icon_image',
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
      const response = await fetch('/api/admin/ambassadors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/ambassadors');
      } else {
        const data = await response.json();
        alert(data.message || '作成に失敗しました');
      }
    } catch (error) {
      console.error('Failed to create ambassador:', error);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">新規アンバサダー作成</h1>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* サムネイル画像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                サムネイル画像 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setThumbnailFileName(file.name);
                      handleUpload(file, 'thumbnail_image', setUploadingThumbnail);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  disabled={uploadingThumbnail}
                />
                {uploadingThumbnail && <p className="mt-2 text-sm text-gray-500">アップロード中...</p>}
                {thumbnailFileName && !uploadingThumbnail && (
                  <p className="mt-2 text-sm text-gray-600">{thumbnailFileName}</p>
                )}
              </div>
              {formData.thumbnail_image && (
                <img
                  src={formData.thumbnail_image}
                  alt="サムネイルプレビュー"
                  className="mt-2 w-40 h-24 object-cover rounded"
                />
              )}
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

            {/* アイコン画像 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                アイコン画像 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIconFileName(file.name);
                      handleUpload(file, 'icon_image', setUploadingIcon);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  disabled={uploadingIcon}
                />
                {uploadingIcon && <p className="mt-2 text-sm text-gray-500">アップロード中...</p>}
                {iconFileName && !uploadingIcon && (
                  <p className="mt-2 text-sm text-gray-600">{iconFileName}</p>
                )}
              </div>
              {formData.icon_image && (
                <img
                  src={formData.icon_image}
                  alt="アイコンプレビュー"
                  className="mt-2 w-12 h-12 object-cover rounded-full"
                />
              )}
            </div>

            {/* 部署名 */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                部署名
              </label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="例: 商品開発部"
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
                <span className="text-gray-400 text-xs ml-2">（最大200文字）</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                maxLength={200}
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
                onClick={() => router.push('/admin/ambassadors')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.thumbnail_image || !formData.icon_image}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {submitting ? '作成中...' : '作成'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
