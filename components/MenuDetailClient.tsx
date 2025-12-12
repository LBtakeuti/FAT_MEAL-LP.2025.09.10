'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/MobileHeader';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  image: string;
  images?: string[];
  features: string[];
  ingredients: string[];
  allergens: string[];
}

interface MenuDetailClientProps {
  menuItem: MenuItem;
}

export default function MenuDetailClient({ menuItem }: MenuDetailClientProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});

  // 複数画像対応
  const displayImages = menuItem.images && menuItem.images.length > 0
    ? menuItem.images
    : [menuItem.image];

  const handleBack = () => {
    // 履歴がある場合は前のページに戻る、ない場合はメニューリストへ
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/menu-list');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Headers */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      <main className="pt-20 sm:pt-0">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          {/* Back Button */}
          <div className="px-4 pt-2 pb-2">
            <button
              onClick={handleBack}
              className="inline-flex items-center text-gray-600 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">戻る</span>
            </button>
          </div>

          {/* Product Image */}
          <div className="relative w-full h-[300px]">
            <Image
              src={displayImages[selectedImageIndex]}
              alt={menuItem.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Thumbnails */}
          {displayImages.length > 1 && (
            <div className="px-4 py-4 bg-gray-50">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {displayImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? 'ring-2 ring-orange-600'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${menuItem.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Info */}
          <div className="px-4 py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {menuItem.name}
            </h1>
            <div className="mb-4">
              <span className="text-xl font-bold text-gray-900">
                {menuItem.calories}
              </span>
              <span className="text-sm text-gray-600 ml-1">kcal</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              {menuItem.description}
            </p>

            {/* Expandable Sections */}
            <div className="space-y-0 border-t border-gray-200">
              {/* 原材料 */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('ingredients')}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-base font-medium text-gray-900">原材料</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedSections.ingredients ? 'rotate-45' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {expandedSections.ingredients && (
                  <div className="pb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {Array.isArray(menuItem.ingredients)
                        ? menuItem.ingredients.join('、')
                        : menuItem.ingredients}
                    </p>
                  </div>
                )}
              </div>

              {/* アレルゲン */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => toggleSection('allergens')}
                  className="w-full flex items-center justify-between py-4 text-left"
                >
                  <span className="text-base font-medium text-gray-900">アレルゲン</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      expandedSections.allergens ? 'rotate-45' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                {expandedSections.allergens && (
                  <div className="pb-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {menuItem.allergens.map((allergen, index) => (
                        <span key={index} className="bg-gray-50 px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-300">
                          {allergen}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600">
                      ※アレルギー情報は目安です。詳細はお問い合わせください。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block">
          <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 lg:py-12">
            {/* Back Button - Left Side */}
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="inline-flex items-center text-gray-600 hover:text-orange-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">戻る</span>
              </button>
            </div>

            <div className="flex gap-8 lg:gap-12">
              {/* Left: Image */}
              <div className="flex-1">
                <div className="relative w-full h-[500px] lg:h-[600px] rounded-lg overflow-hidden">
                  <Image
                    src={displayImages[selectedImageIndex]}
                    alt={menuItem.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Thumbnails */}
                {displayImages.length > 1 && (
                  <div className="flex gap-3 mt-4">
                    {displayImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden transition-all ${
                          selectedImageIndex === index
                            ? 'ring-2 ring-orange-600'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={img}
                          alt={`${menuItem.name} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Product Info */}
              <div className="flex-1 max-w-[500px]">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {menuItem.name}
                </h1>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {menuItem.calories}
                  </span>
                  <span className="text-base text-gray-600 ml-2">kcal</span>
                </div>

                <p className="text-base lg:text-lg text-gray-700 leading-relaxed mb-8">
                  {menuItem.description}
                </p>

                {/* Ingredients */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">原材料</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {Array.isArray(menuItem.ingredients)
                      ? menuItem.ingredients.join('、')
                      : menuItem.ingredients}
                  </p>
                </div>

                {/* Allergens */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">アレルギー情報</h2>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {menuItem.allergens.map((allergen, index) => (
                      <span key={index} className="bg-gray-50 px-3 py-1 rounded-full text-sm text-gray-700 border border-gray-300">
                        {allergen}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    ※アレルギー情報は目安です。詳細はお問い合わせください。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
