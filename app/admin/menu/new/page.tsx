'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface MenuItem {
  name: string;
  description: string;
  price: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  images: string[];
  features: string[];
  ingredients: string;
  allergens: string[];
  stock: number;
}

export default function NewMenuPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<MenuItem>({
    name: '',
    description: '',
    price: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    images: [],
    features: [''],
    ingredients: '',
    allergens: [''],
    stock: 300
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 空の配列要素を削除
    const cleanedData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== ''),
      allergens: formData.allergens.filter(a => a.trim() !== '')
    };

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        router.push('/admin/menu');
      }
    } catch (error) {
      console.error('Failed to create menu item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      try {
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (response.ok) {
          const { url } = await response.json();
          setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...formData.images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    setFormData({ ...formData, images: newImages });
  };

  const handleChange = (field: keyof MenuItem, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleArrayChange = (field: 'features' | 'allergens', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayItem = (field: 'features' | 'allergens') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayItem = (field: 'features' | 'allergens', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">新規弁当追加</h1>
        <button
          onClick={() => router.push('/admin/menu')}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          キャンセル
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {/* 画像管理 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">商品画像 *</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              複数の画像をアップロードできます。1枚目の画像がメインとして表示されます。
              <span className="text-red-500 ml-1">※最低1枚は必須</span>
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`商品画像 ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        メイン画像
                      </div>
                    )}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'up')}
                        className="bg-white p-1 rounded shadow hover:bg-gray-100"
                        title="前へ移動"
                      >
                        ↑
                      </button>
                    )}
                    {index < formData.images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, 'down')}
                        className="bg-white p-1 rounded shadow hover:bg-gray-100"
                        title="後へ移動"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="bg-red-600 text-white p-1 rounded shadow hover:bg-red-700"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    画像 {index + 1}
                  </p>
                </div>
              ))}
            
            {/* 画像追加ボタン */}
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                  formData.images.length === 0 
                    ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400' 
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                }`}
              >
                <svg 
                  className={`w-8 h-8 mb-2 ${
                    formData.images.length === 0 ? 'text-red-400' : 'text-gray-400'
                  }`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className={`text-sm ${
                  formData.images.length === 0 ? 'text-red-600 font-semibold' : 'text-gray-500'
                }`}>
                  {formData.images.length === 0 ? '画像を追加（必須）' : '画像を追加'}
                </span>
                <span className="text-xs text-gray-400 mt-1">クリックまたはドラッグ</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 基本情報 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">基本情報</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品名 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明 *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                価格 *
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="例: ¥1,290"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                初期在庫数
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => handleChange('stock', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>
          </div>

          {/* 栄養情報 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">栄養情報</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カロリー *
              </label>
              <input
                type="text"
                value={formData.calories}
                onChange={(e) => handleChange('calories', e.target.value)}
                placeholder="例: 1290"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                タンパク質 (g) *
              </label>
              <input
                type="text"
                value={formData.protein}
                onChange={(e) => handleChange('protein', e.target.value)}
                placeholder="例: 35.8"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                脂質 (g) *
              </label>
              <input
                type="text"
                value={formData.fat}
                onChange={(e) => handleChange('fat', e.target.value)}
                placeholder="例: 12.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                炭水化物 (g) *
              </label>
              <input
                type="text"
                value={formData.carbs}
                onChange={(e) => handleChange('carbs', e.target.value)}
                placeholder="例: 45.2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* 特徴 */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">
            特徴
            <button
              type="button"
              onClick={() => addArrayItem('features')}
              className="ml-4 text-sm text-blue-600 hover:text-blue-700"
            >
              + 追加
            </button>
          </h2>
          {formData.features.map((feature, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleArrayChange('features', index, e.target.value)}
                placeholder="例: 高タンパク質で筋トレ後に最適"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.features.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('features', index)}
                  className="px-3 py-2 text-red-600 hover:text-red-700"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 原材料 */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">原材料</h2>
          <textarea
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="例: 鶏肉（国産）、小麦粉、卵、タルタルソース、キャベツ、白米"
          />
          <p className="text-sm text-gray-500 mt-1">カンマ区切りで入力してください</p>
        </div>

        {/* アレルギー情報 */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">
            アレルギー情報
            <button
              type="button"
              onClick={() => addArrayItem('allergens')}
              className="ml-4 text-sm text-blue-600 hover:text-blue-700"
            >
              + 追加
            </button>
          </h2>
          {formData.allergens.map((allergen, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={allergen}
                onChange={(e) => handleArrayChange('allergens', index, e.target.value)}
                placeholder="例: 小麦"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {formData.allergens.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeArrayItem('allergens', index)}
                  className="px-3 py-2 text-red-600 hover:text-red-700"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 送信ボタン */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/menu')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSaving || formData.images.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '追加'}
          </button>
        </div>
      </form>

      {/* Supabase連携準備のコメント */}
      {/* 
        TODO: Supabase連携時の実装
        1. Supabase Storageに画像をアップロード
        2. データベースにメニュー情報を保存
        3. リアルタイム在庫管理の実装
      */}
    </div>
  );
}