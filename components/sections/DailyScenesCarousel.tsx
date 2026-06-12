'use client';

import React, { useEffect, useRef } from 'react';

/**
 * F77: 朝昼夜カードのモバイル横カルーセルにオートプレイを付与するクライアントラッパー。
 *
 * - カード（children）は SSR 済みのものをそのまま描画＝PE安全（JS無しでも3枚見える手動カルーセル）。
 * - autoplay は装飾。3秒ごとに右へ1カード送り、最後の次は先頭(0)に戻る（ループ）。
 * - ユーザー操作（pointerdown/touch/wheel/hover/focus）中は一時停止し、操作が落ち着いたら再開。
 * - prefers-reduced-motion 時は autoplay しない（静止）。
 * - タブ非表示（visibilitychange）時は止める。
 * - モバイルのカルーセル時のみ動作（sm+ は3カラムgridで横スクロール不可＝自然に no-op）。
 * - scroll-behavior smooth ＋ scroll-snap でスムーズに送る。
 */

const INTERVAL_MS = 3000;
// 操作後にこの時間が経過したら autoplay 再開。
const RESUME_DELAY_MS = 4000;

interface DailyScenesCarouselProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export default function DailyScenesCarousel({
  children,
  className = '',
  'aria-label': ariaLabel,
}: DailyScenesCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // reduced-motion 時は autoplay しない（静止＝手動カルーセルのまま）。
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let tickTimer: ReturnType<typeof setInterval> | null = null;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    // sm+（3カラムgrid＝横スクロール不可）では何もしない。
    const isCarouselActive = () => el.scrollWidth > el.clientWidth + 1;

    const advance = () => {
      if (!isCarouselActive()) return;
      const cards = Array.from(el.children) as HTMLElement[];
      if (cards.length === 0) return;
      // 各カードのスクロール内位置（先頭カードを基準に正規化）。
      // offsetLeft は offsetParent 基準で先頭にコンテナの padding 分が乗るため、
      // 先頭カードの offsetLeft を引いてスクロール内座標に変換する。
      const base = cards[0].offsetLeft;
      const positions = cards.map((c) => c.offsetLeft - base);
      const maxScroll = el.scrollWidth - el.clientWidth;
      const atEnd = el.scrollLeft >= maxScroll - 1;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      // 現在位置より右にある最初のカードへスナップ。無ければ先頭へ戻る。
      const next = positions.find((p) => p > el.scrollLeft + 1);
      el.scrollTo({ left: next ?? 0, behavior: 'smooth' });
    };

    const start = () => {
      if (tickTimer || document.hidden) return;
      tickTimer = setInterval(advance, INTERVAL_MS);
    };
    const stop = () => {
      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
    };
    // 操作中は止め、落ち着いたら再開（ユーザー操作を尊重）。
    const pauseThenResume = () => {
      stop();
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = setTimeout(start, RESUME_DELAY_MS);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    // ユーザー操作系：触っている間は自動送りしない。
    el.addEventListener('pointerdown', pauseThenResume);
    el.addEventListener('touchstart', pauseThenResume, { passive: true });
    el.addEventListener('wheel', pauseThenResume, { passive: true });
    el.addEventListener('mouseenter', stop);
    el.addEventListener('mouseleave', start);
    el.addEventListener('focusin', stop);
    el.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', onVisibility);

    start();

    return () => {
      stop();
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener('pointerdown', pauseThenResume);
      el.removeEventListener('touchstart', pauseThenResume);
      el.removeEventListener('wheel', pauseThenResume);
      el.removeEventListener('mouseenter', stop);
      el.removeEventListener('mouseleave', start);
      el.removeEventListener('focusin', stop);
      el.removeEventListener('focusout', start);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div ref={ref} className={className} aria-label={ariaLabel} style={{ scrollBehavior: 'smooth' }}>
      {children}
    </div>
  );
}
