'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type AnimationPhase = 'idle' | 'exit' | 'entering' | 'enter';
type SlideDirection = 'left' | 'right';

interface UseCarouselOptions {
  itemCount: number;
  autoPlayInterval?: number;
  autoPlayEnabled?: boolean;
}

export function useCarousel(options: UseCarouselOptions) {
  const { itemCount, autoPlayInterval = 8000, autoPlayEnabled = true } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
  const [slideDirection, setSlideDirection] = useState<SlideDirection>('left');

  const autoSwipeTimer = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionTime = useRef<number>(Date.now());

  // スワイプ用の状態
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const animateToIndex = useCallback(
    (newIndex: number, direction: SlideDirection) => {
      if (animationPhase !== 'idle') return;

      setSlideDirection(direction);
      setAnimationPhase('exit');

      setTimeout(() => {
        setCurrentIndex(newIndex);
        setAnimationPhase('entering');

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setAnimationPhase('enter');

            setTimeout(() => {
              setAnimationPhase('idle');
            }, 300);
          });
        });
      }, 300);
    },
    [animationPhase]
  );

  const resetAutoSwipeTimer = useCallback(() => {
    lastInteractionTime.current = Date.now();

    if (autoSwipeTimer.current) {
      clearInterval(autoSwipeTimer.current);
    }

    if (autoPlayEnabled && itemCount > 1) {
      autoSwipeTimer.current = setInterval(() => {
        const timeSinceLastInteraction =
          Date.now() - lastInteractionTime.current;
        if (timeSinceLastInteraction >= autoPlayInterval) {
          const newIndex = (currentIndex + 1) % itemCount;
          animateToIndex(newIndex, 'left');
          lastInteractionTime.current = Date.now();
        }
      }, 1000);
    }
  }, [autoPlayEnabled, itemCount, autoPlayInterval, currentIndex, animateToIndex]);

  const handlePrevious = useCallback(() => {
    const newIndex = (currentIndex - 1 + itemCount) % itemCount;
    animateToIndex(newIndex, 'right');
    resetAutoSwipeTimer();
  }, [currentIndex, itemCount, animateToIndex, resetAutoSwipeTimer]);

  const handleNext = useCallback(() => {
    const newIndex = (currentIndex + 1) % itemCount;
    animateToIndex(newIndex, 'left');
    resetAutoSwipeTimer();
  }, [currentIndex, itemCount, animateToIndex, resetAutoSwipeTimer]);

  const handleDotClick = useCallback(
    (index: number) => {
      if (index === currentIndex) return;
      const direction = index > currentIndex ? 'left' : 'right';
      animateToIndex(index, direction);
      resetAutoSwipeTimer();
    },
    [currentIndex, animateToIndex, resetAutoSwipeTimer]
  );

  // タッチイベントハンドラー
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        handleNext();
      } else {
        handlePrevious();
      }
    }
  }, [handleNext, handlePrevious]);

  // 自動再生の初期化
  useEffect(() => {
    resetAutoSwipeTimer();

    return () => {
      if (autoSwipeTimer.current) {
        clearInterval(autoSwipeTimer.current);
      }
    };
  }, [resetAutoSwipeTimer]);

  // アニメーションクラスの計算
  const getAnimationClasses = useCallback(() => {
    const baseClasses =
      animationPhase === 'entering'
        ? ''
        : 'transition-all duration-300 ease-out';

    let transformClasses = 'translate-x-0 opacity-100';

    if (animationPhase === 'exit') {
      transformClasses =
        slideDirection === 'left'
          ? '-translate-x-full opacity-0'
          : 'translate-x-full opacity-0';
    } else if (animationPhase === 'entering') {
      transformClasses =
        slideDirection === 'left'
          ? 'translate-x-full opacity-0'
          : '-translate-x-full opacity-0';
    }

    return `${baseClasses} ${transformClasses}`;
  }, [animationPhase, slideDirection]);

  return {
    currentIndex,
    animationPhase,
    slideDirection,
    handlePrevious,
    handleNext,
    handleDotClick,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getAnimationClasses,
  };
}
