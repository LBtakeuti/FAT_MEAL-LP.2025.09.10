'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { MenuItem } from '@/types';

interface MenuCardProps {
  item: MenuItem;
  variant?: 'mobile' | 'desktop';
  priority?: boolean;
  className?: string;
}

export function MenuCard({
  item,
  variant = 'desktop',
  priority = false,
  className = '',
}: MenuCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/menu/${item.id}`);
  };

  if (variant === 'mobile') {
    return (
      <div
        onClick={handleClick}
        className={`bg-white shadow-lg hover:shadow-xl h-[360px] flex flex-col overflow-hidden cursor-pointer rounded-lg ${className}`}
      >
        <div className="relative h-[220px] flex-shrink-0">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 280px"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        </div>
        <div className="p-3 flex flex-col">
          <h3 className="text-base font-bold text-gray-900 mb-2 truncate">
            {item.name}
          </h3>
          <div className="mb-2">
            <span className="text-xl font-bold text-orange-600">
              {item.calories}
            </span>
            <span className="text-xs text-gray-600 ml-1">kcal</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">タンパク質</span>
              <span className="font-semibold text-gray-900">{item.protein}g</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">脂質</span>
              <span className="font-semibold text-gray-900">{item.fat}g</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">炭水化物</span>
              <span className="font-semibold text-gray-900">{item.carbs}g</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col ${className}`}
    >
      <div className="relative w-full h-[200px]">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{item.name}</h3>
        <div className="mb-4">
          <span className="text-3xl font-bold text-orange-600">
            {item.calories}
          </span>
          <span className="text-sm text-gray-600 ml-1">kcal</span>
        </div>
        <div className="space-y-2 mb-4 flex-grow">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">タンパク質</span>
            <span className="font-semibold text-gray-900">{item.protein}g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">脂質</span>
            <span className="font-semibold text-gray-900">{item.fat}g</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">炭水化物</span>
            <span className="font-semibold text-gray-900">{item.carbs}g</span>
          </div>
        </div>
        <div className="flex items-center justify-center mt-auto">
          <span className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm">
            詳細を見る
          </span>
        </div>
      </div>
    </div>
  );
}
