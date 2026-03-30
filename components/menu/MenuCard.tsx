'use client';

import Image from 'next/image';
import type { MenuItem } from '@/types';

interface MenuCardProps {
  item: MenuItem;
  priority?: boolean;
  className?: string;
  onSelect?: (item: MenuItem) => void;
}

// 画像がない場合のフォールバック表示
function ImagePlaceholder({ name }: { name: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      <span className="text-gray-400 text-4xl font-bold opacity-30">
        {name.charAt(0)}
      </span>
    </div>
  );
}

export function MenuCard({
  item,
  priority = false,
  className = '',
  onSelect,
}: MenuCardProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}
    >
      {/* 画像 */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <ImagePlaceholder name={item.name} />
        )}
      </div>

      {/* カード情報 */}
      <div className="p-2.5">
        {/* タイトル */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2">
          {item.name}
        </h3>

        {/* 栄養バッジ */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium border border-orange-100">
            {item.calories} kcal
          </span>
          <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
            タンパク質 {item.protein}g
          </span>
          {item.weight && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {item.weight}g
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
