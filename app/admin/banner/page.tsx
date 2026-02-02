'use client';

import { useState, useEffect, useRef } from 'react';

interface BannerSettings {
  is_active: boolean;
  image_url: string;
  link_url: string;
  updated_at: string;
}

export default function BannerManagementPage() {
  const [settings, setSettings] = useState<BannerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/banner');
      if (res.status === 401) {
        window.location.href = '/admin/login?redirect=/admin/banner';
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setSettings(json.data ?? json);
      } else {
        console.error('バナー設定の取得に失敗:', res.status);
      }
    } catch (error) {
      console.error('バナー設定の取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: settings.is_active,
          image_url: settings.image_url,
          link_url: settings.link_url,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setSettings(json.data ?? json);
        setMessage({ type: 'success', text: 'バナー設定を保存しました' });
      } else {
        setMessage({ type: 'error', text: '保存に失敗しました' });
      }
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(prev => prev ? { ...prev, image_url: data.url } : null);
      } else {
        alert('画像のアップロードに失敗しました');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('エラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      } else {
        alert('画像ファイルを選択してください');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      } else {
        alert('画像ファイルを選択してください');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">バナー設定の取得に失敗しました</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">バナー管理</h1>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 表示ON/OFFトグル */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.is_active}
                onChange={(e) =>
                  setSettings(prev => prev ? { ...prev, is_active: e.target.checked } : null)
                }
                className="sr-only"
              />
              <div
                className={`w-14 h-7 rounded-full transition-colors ${
                  settings.is_active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  settings.is_active ? 'translate-x-7' : ''
                }`}
              />
            </div>
            <span className="font-medium text-gray-700">
              バナー表示: {settings.is_active ? 'ON' : 'OFF'}
            </span>
          </label>
        </div>

        {/* 画像アップロード */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            バナー画像
          </label>

          {/* プレビュー */}
          {settings.image_url && (
            <div className="mb-3">
              <img
                src={settings.image_url}
                alt="バナープレビュー"
                className="max-w-[600px] w-full rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* ドラッグ&ドロップエリア */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {uploading ? (
              <p className="text-gray-500">アップロード中...</p>
            ) : (
              <>
                <p className="text-gray-500">
                  画像をドラッグ&ドロップ、またはクリックして選択
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  推奨サイズ: 600x100px
                </p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* 画像URL直接入力 */}
          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">
              または画像URLを直接入力
            </label>
            <input
              type="text"
              value={settings.image_url}
              onChange={(e) =>
                setSettings(prev => prev ? { ...prev, image_url: e.target.value } : null)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* リンク先URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            リンク先URL
          </label>
          <input
            type="text"
            value={settings.link_url}
            onChange={(e) =>
              setSettings(prev => prev ? { ...prev, link_url: e.target.value } : null)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://lin.ee/..."
          />
        </div>

        {/* 保存ボタン */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-md transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          {settings.updated_at && (
            <span className="text-sm text-gray-500">
              最終更新: {new Date(settings.updated_at).toLocaleString('ja-JP')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
