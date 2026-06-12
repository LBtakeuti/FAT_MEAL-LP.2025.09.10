'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * F75: スクロールでビューに入ったら 0→実値へカウントアップする数値表示。
 *
 * プログレッシブエンハンスメント（SEO/PE安全）:
 * - 既定の表示は「実値」（SSR/no-JS/IO非対応/prefers-reduced-motion では実値を即表示）。
 *   0 で固定されない・SSRに実値が出る＝クローラー/JS無効でも正しい数値が見える。
 * - クライアント mount 時に「IO対応かつreduced-motion無効」のときだけ、描画前(useLayoutEffect)に
 *   0 から開始し、IntersectionObserver の初回交差でカウントアップ（ease-out）。
 * - レイアウトシフト回避: tabular-nums＋桁数ぶんの min-width（ch）で数字幅を固定。
 */

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface CountUpProps {
  /** カウントアップの最終値（実値）。 */
  value: number;
  /** 小数桁数（実値に小数がある場合）。既定0。 */
  decimals?: number;
  /** カンマ区切り（千区切り）。既定 true。 */
  separator?: boolean;
  /** アニメーション時間(ms)。既定1200。 */
  durationMs?: number;
  className?: string;
}

function format(n: number, decimals: number, separator: boolean): string {
  const fixed = n.toFixed(decimals);
  if (!separator) return fixed;
  const [intPart, decPart] = fixed.split('.');
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decPart != null ? `${withSep}.${decPart}` : withSep;
}

export function CountUp({
  value,
  decimals = 0,
  separator = true,
  durationMs = 1200,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  // 既定は実値（PE: SSR/no-JS/reduced-motion で実値即表示）。
  const [display, setDisplay] = useState<number>(value);
  const [animatable, setAnimatable] = useState(false);

  useIsoLayoutEffect(() => {
    const canAnimate =
      typeof window !== 'undefined' &&
      'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (canAnimate) {
      setDisplay(0); // 描画前に0へ（アニメ可能時のみ）
      setAnimatable(true);
    }
  }, []);

  useEffect(() => {
    if (!animatable) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect(); // 初回のみ
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / durationMs);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          setDisplay(value * eased);
          if (t < 1) raf = requestAnimationFrame(tick);
          else setDisplay(value); // 端数誤差を避け実値で確定
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [animatable, value, durationMs]);

  // 整数部の桁数ぶん min-width を確保し、カウントアップ中の幅変動(CLS)を防ぐ。
  const maxChars = format(value, decimals, separator).length;

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-block', minWidth: `${maxChars}ch`, fontVariantNumeric: 'tabular-nums' }}
    >
      {format(display, decimals, separator)}
    </span>
  );
}

export default CountUp;
