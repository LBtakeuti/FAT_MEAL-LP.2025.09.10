'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * F73: スクロール連動フェードインの共通部品。
 *
 * プログレッシブエンハンスメント（SEO/ no-JS 配慮）:
 * - SSR/初回HTML・JS無効・IO非対応・prefers-reduced-motion では「常に可視」。
 *   初期状態を opacity:0 でレンダーしない（コンテンツを隠さない＝Googlebot対策）。
 * - クライアント mount 時に「IO対応 かつ reduced-motion無効」のときだけ、
 *   描画前(useLayoutEffect)に pre-reveal（opacity:0 + translateY）へ切替→
 *   IntersectionObserver の初回交差で reveal（opacity:1 + translateY0）。
 * - 一度出たら戻さない（observer は発火後 disconnect）。
 * - transform / opacity のみでレイアウトシフトなし。
 */

// SSR でも useLayoutEffect の警告を出さないため（サーバでは no-op）。
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface RevealProps {
  children: React.ReactNode;
  /** stagger 用の遅延（ms）。見出し0→要素群を 80〜120ms 刻みで。 */
  delayMs?: number;
  /** ラップ要素のタグ（既定 div）。section 等にしたい場合に指定。 */
  as?: React.ElementType;
  className?: string;
  /** IntersectionObserver の threshold（既定 0.18）。 */
  threshold?: number;
}

type RevealState = 'static' | 'hidden' | 'shown';

export function Reveal({
  children,
  delayMs = 0,
  as: Tag = 'div',
  className,
  threshold = 0.18,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  // 初期は 'static'（= 常に可視、SSR/no-JS で隠さない）。
  const [state, setState] = useState<RevealState>('static');

  // 描画前に「アニメ可能」と判定できた場合のみ hidden に切替（FOUC回避）。
  useIsoLayoutEffect(() => {
    const canAnimate =
      typeof window !== 'undefined' &&
      'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (canAnimate) setState('hidden');
  }, []);

  useEffect(() => {
    if (state !== 'hidden') return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('shown');
          observer.disconnect(); // 初回のみ
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [state, threshold]);

  // 'static'（PE/reduced-motion）= スタイル無し＝常に可視。
  const style: React.CSSProperties | undefined =
    state === 'static'
      ? undefined
      : {
          opacity: state === 'shown' ? 1 : 0,
          transform: state === 'shown' ? 'translateY(0)' : 'translateY(18px)',
          transition: `opacity 0.55s ease-out ${delayMs}ms, transform 0.55s ease-out ${delayMs}ms`,
          willChange: 'opacity, transform',
        };

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
}

export default Reveal;
