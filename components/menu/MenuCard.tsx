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
      className={`group cursor-pointer ${className}`}
    >
      {/* 画像 - 4:3比率 */}
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
        {/* ホバー時の拡大アイコン */}
        <div className="absolute bottom-2 right-2 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>
      {/* タイトル */}
      <h3 className="mt-2 text-sm font-medium text-gray-900 text-center line-clamp-2">
        {item.name}
      </h3>
    </div>
  );
}
