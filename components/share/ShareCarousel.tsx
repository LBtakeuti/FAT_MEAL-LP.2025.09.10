'use client';

import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { SharePhotoLike } from '@/lib/share-download';

interface Props {
  photos: SharePhotoLike[];
  selectedIds: Set<string>;
  onToggle: (photoId: string) => void;
}

/** 写真カルーセル。各スライド右上にチェックボックスを表示。PC/SP 共通レイアウト */
export function ShareCarousel({ photos, selectedIds, onToggle }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateState = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateState();
    emblaApi.on('select', updateState);
    emblaApi.on('reInit', updateState);
    return () => {
      emblaApi.off('select', updateState);
      emblaApi.off('reInit', updateState);
    };
  }, [emblaApi, updateState]);

  return (
    <div>
      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden rounded-lg bg-white shadow">
          <div className="flex">
            {photos.map((photo) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <div key={photo.id} className="relative flex-[0_0_100%] aspect-square bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.filename} className="w-full h-full object-contain" />
                  <label className="absolute top-3 right-3 inline-flex items-center gap-2 bg-white/90 backdrop-blur rounded-full pl-2 pr-3 py-1.5 shadow cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(photo.id)}
                      className="w-4 h-4 accent-orange-600 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {isSelected ? '選択中' : '選択'}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canPrev}
          aria-label="前の写真"
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow items-center justify-center text-gray-700 disabled:opacity-30 hover:bg-white"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canNext}
          aria-label="次の写真"
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow items-center justify-center text-gray-700 disabled:opacity-30 hover:bg-white"
        >
          ›
        </button>
      </div>

      <div className="mt-3 text-center text-sm text-gray-600 tabular-nums">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
