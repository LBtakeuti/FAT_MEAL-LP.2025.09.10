'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewMenuPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    main_image: '',
    sub_images: ['', '', '', ''],
    ingredients: [] as string[],
    allergens: [] as string[],
    is_active: true,
    display_order: 0,
  });
  const [ingredientInput, setIngredientInput] = useState('');
  const [allergenInput, setAllergenInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [draggingMain, setDraggingMain] = useState(false);
  const [draggingSub, setDraggingSub] = useState<number | null>(null);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSub, setUploadingSub] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sub_images: formData.sub_images.filter(img => img.trim() !== ''),
        }),
      });

      if (response.ok) {
        router.push('/admin/menu');
      } else {
        const error = await response.json();
        alert(`作成に失敗しました: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to create menu:', error);
      alert('エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  // Google Driveリンクを表示可能な形式に変換
  const convertGoogleDriveUrl = (url: string): string => {
    // https://drive.google.com/file/d/FILE_ID/view 形式
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
    // https://drive.google.com/open?id=FILE_ID 形式
    const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch && url.includes('drive.google.com')) {
      return `https://lh3.googleusercontent.com/d/${openIdMatch[1]}`;
    }
    return url;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue = value;

    // 画像URLの場合はGoogle Driveリンクを変換
    if (name === 'main_image' && value.includes('drive.google.com')) {
      processedValue = convertGoogleDriveUrl(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : processedValue
    }));
  };

  const handleSubImageChange = (index: number, value: string) => {
    // Google Driveリンクを変換
    const processedValue = value.includes('drive.google.com')
      ? convertGoogleDriveUrl(value)
      : value;

    const newSubImages = [...formData.sub_images];
    newSubImages[index] = processedValue;
    setFormData(prev => ({ ...prev, sub_images: newSubImages }));
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientInput.trim()]
      }));
      setIngredientInput('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addAllergen = () => {
    if (allergenInput.trim()) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, allergenInput.trim()]
      }));
      setAllergenInput('');
    }
  };

  const removeAllergen = (index: number) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = async (file: File, isSubImage: boolean = false, subIndex?: number) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (isSubImage && subIndex !== undefined) {
        setUploadingSub(subIndex);
      } else {
        setUploadingMain(true);
      }

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (isSubImage && subIndex !== undefined) {
          handleSubImageChange(subIndex, data.url);
        } else {
          setFormData(prev => ({ ...prev, main_image: data.url }));
        }
      } else {
        alert('画像のアップロードに失敗しました');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('エラーが発生しました');
    } finally {
      if (isSubImage && subIndex !== undefined) {
        setUploadingSub(null);
      } else {
        setUploadingMain(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent, isSubImage: boolean = false, subIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSubImage && subIndex !== undefined) {
      setDraggingSub(subIndex);
    } else {
      setDraggingMain(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingMain(false);
    setDraggingSub(null);
  };

  const handleDrop = (e: React.DragEvent, isSubImage: boolean = false, subIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSubImage && subIndex !== undefined) {
      setDraggingSub(null);
    } else {
      setDraggingMain(false);
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file, isSubImage, subIndex);
      } else {
        alert('画像ファイルを選択してください');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, isSubImage: boolean = false, subIndex?: number) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileUpload(file, isSubImage, subIndex);
    }
    // 同じファイルを再度選択できるようにリセット
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">新規弁当メニュー作成</h1>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
            {/* 基本情報 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">基本情報</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    メニュー名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="例: ハンバーグ&チキンステーキ弁当"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    説明文
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="メニューの説明を入力してください"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    価格（円）
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="例: 1550"
                  />
                </div>
              </div>
            </div>

            {/* 画像 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">画像</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="main_image" className="block text-sm font-medium text-gray-700 mb-2">
                    メイン画像URL
                  </label>
                  <div
                    onDragOver={(e) => handleDragOver(e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e)}
                    className={`mt-1 border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                      draggingMain
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {uploadingMain ? (
                      <div className="text-gray-600">アップロード中...</div>
                    ) : formData.main_image ? (
                      <div className="relative">
                        <img
                          src={formData.main_image}
                          alt="プレビュー"
                          className="max-w-full max-h-64 mx-auto object-contain border border-gray-300 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, main_image: '' }))}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          画像を削除
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-2">
                          画像をドラッグ&ドロップするか、クリックして選択
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileInput(e)}
                          className="hidden"
                          id="main_image_file"
                        />
                        <label
                          htmlFor="main_image_file"
                          className="inline-block px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 cursor-pointer text-sm"
                        >
                          ファイルを選択
                        </label>
                      </>
                    )}
                  </div>
                  <input
                    type="text"
                    id="main_image"
                    name="main_image"
                    value={formData.main_image}
                    onChange={handleChange}
                    className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="https://example.com/image.jpg または上記からアップロード（任意）"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サブ画像URL（最大4枚）
                  </label>
                  {formData.sub_images.map((img, index) => (
                    <div key={index} className="mt-2">
                      <div
                        onDragOver={(e) => handleDragOver(e, true, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, true, index)}
                        className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
                          draggingSub === index
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-300 bg-gray-50'
                        }`}
                      >
                        {uploadingSub === index ? (
                          <div className="text-gray-600 text-sm">アップロード中...</div>
                        ) : img ? (
                          <div className="relative">
                            <img
                              src={img}
                              alt={`サブ画像${index + 1} プレビュー`}
                              className="max-w-full max-h-48 mx-auto object-contain border border-gray-300 rounded"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubImageChange(index, '')}
                              className="mt-2 text-xs text-red-600 hover:text-red-800"
                            >
                              画像を削除
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-gray-600 mb-2">
                              画像をドラッグ&ドロップするか、クリックして選択
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileInput(e, true, index)}
                              className="hidden"
                              id={`sub_image_file_${index}`}
                            />
                            <label
                              htmlFor={`sub_image_file_${index}`}
                              className="inline-block px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 cursor-pointer text-xs"
                            >
                              ファイルを選択
                            </label>
                          </>
                        )}
                      </div>
                      <input
                        type="text"
                        value={img}
                        onChange={(e) => handleSubImageChange(index, e.target.value)}
                        className="mt-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                        placeholder={`サブ画像${index + 1} URL または上記からアップロード（任意）`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 栄養成分 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">栄養成分</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium text-gray-700">
                    カロリー（kcal） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="calories"
                    name="calories"
                    required
                    min="0"
                    value={formData.calories}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="1550"
                  />
                </div>

                <div>
                  <label htmlFor="protein" className="block text-sm font-medium text-gray-700">
                    タンパク質（g） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="protein"
                    name="protein"
                    required
                    min="0"
                    step="0.1"
                    value={formData.protein}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="92"
                  />
                </div>

                <div>
                  <label htmlFor="fat" className="block text-sm font-medium text-gray-700">
                    脂質（g） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="fat"
                    name="fat"
                    required
                    min="0"
                    step="0.1"
                    value={formData.fat}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="52"
                  />
                </div>

                <div>
                  <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">
                    炭水化物（g） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="carbs"
                    name="carbs"
                    required
                    min="0"
                    step="0.1"
                    value={formData.carbs}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                    placeholder="115"
                  />
                </div>
              </div>
            </div>

            {/* 成分表記 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">成分表記</h2>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                  placeholder="成分を入力してEnter"
                />
                <button
                  type="button"
                  onClick={addIngredient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  追加
                </button>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.ingredients.map((ingredient, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {ingredient}
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* アレルゲン表記 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">アレルゲン表記</h2>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={allergenInput}
                  onChange={(e) => setAllergenInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm px-3 py-2 border"
                  placeholder="アレルゲンを入力してEnter（例: 小麦、卵、乳）"
                />
                <button
                  type="button"
                  onClick={addAllergen}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  追加
                </button>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.allergens.map((allergen, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                  >
                    {allergen}
                    <button
                      type="button"
                      onClick={() => removeAllergen(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 公開設定 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                公開する
              </label>
            </div>

            {/* 送信ボタン */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => router.push('/admin/menu')}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={submitting}
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
