'use client';

import React from 'react';
import Link from 'next/link';

/**
 * F76: Uiverse "Voxybuns" 風の3D押し込みボタン。
 *
 * 二層構造:
 * - 土台（outer）= 濃いトーン＝枠/影の役。border-radius を上面と共有。
 * - 上面（inner span）= メイントーン・白文字。translateY で浮かせ、
 *   hover でさらに浮き、active で沈む（土台に重なる）。
 *
 * variant（色の意味分け）:
 * - orange = ブランドオレンジ（定期/汎用の購入導線）。土台 orange-800・上面 orange-600。
 * - amber  = お試し導線（お試し/単発を色で区別）。土台 amber-700・上面 amber-500。
 *
 * ガード:
 * - 挙動は呼び出し側のまま（onClick / href / type）。<button>/<a>/<Link> を出し分け。
 * - a11y: フォーカスリングは土台に表示。disabled 時は沈み演出を無効化＋操作不可。
 * - prefers-reduced-motion: 動き（transform/transition）を抑制（motion-reduce）。
 * - transform のみのアニメで CLS なし。色はトークン（orange/amber 系）のみ。
 */

type Variant = 'orange' | 'amber';
type Size = 'md' | 'lg' | 'full' | 'plan';

interface CommonProps {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

type PushButtonProps =
  | (CommonProps & { href: string; onClick?: never; type?: never })
  | (CommonProps & { href?: undefined; onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; type?: 'button' | 'submit' });

const SIZE_INNER: Record<Size, string> = {
  md: 'px-5 py-2 text-sm lg:text-base',
  lg: 'px-8 py-3 text-base sm:text-lg',
  full: 'w-full py-3 text-base',
  // plan: プランカード用（h-14 / 大きめ文字・全幅）。角丸は rounded-xl を共有。
  plan: 'w-full h-14 flex items-center justify-center text-lg',
};

// size ごとの角丸（土台と上面で共有）。plan のみ rounded-xl、他は rounded-full。
const RADIUS: Record<Size, string> = {
  md: 'rounded-full',
  lg: 'rounded-full',
  full: 'rounded-full',
  plan: 'rounded-xl',
};

// variant ごとの色トークン。土台=濃いトーン、上面=メイントーン（白文字）。
// 「お試し(amber)/定期(orange)」の導線差を色で保つため variant を分離。
const VARIANT = {
  orange: { outer: 'bg-orange-800', inner: 'bg-orange-600', innerDisabled: 'bg-orange-600/60', ring: 'ring-orange-400' },
  amber: { outer: 'bg-amber-700', inner: 'bg-amber-500', innerDisabled: 'bg-amber-500/60', ring: 'ring-amber-400' },
} as const;

// 上面の浮き演出（共通）。浮き→hoverでさらに浮き→activeで沈む。
// reduced-motion では transition/translate を無効化（motion-reduce）。
const LIFT =
  'transition-transform duration-100 ease-out will-change-transform ' +
  '-translate-y-[0.2em] hover:-translate-y-[0.33em] active:translate-y-0 ' +
  'motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:hover:translate-y-0';

export function PushButton(props: PushButtonProps) {
  const { children, variant = 'orange', size = 'md', className = '', disabled = false } = props;
  const ariaLabel = props['aria-label'];
  const v = VARIANT[variant];
  const radius = RADIUS[size];
  const isFullWidth = size === 'full' || size === 'plan';

  // 土台（outer）: 濃いトーン。inner の浮き量ぶんの押し込み代を持つ。
  const outerCls = (
    `inline-block ${radius} ${v.outer} p-0 align-bottom select-none ` +
    `focus-within:outline-none focus-within:ring-2 ${v.ring} focus-within:ring-offset-2 ` +
    `${isFullWidth ? 'w-full' : ''} ${className}`
  ).trim();

  // 上面（inner）: メイントーン・白文字。disabled 時は沈み演出を無効化。
  const innerCls =
    `block ${radius} text-white font-bold text-center whitespace-nowrap ${SIZE_INNER[size]} ` +
    (disabled ? `${v.innerDisabled} translate-y-0` : `${v.inner} ${LIFT}`);

  const inner = <span className={innerCls}>{children}</span>;

  // href あり → Link（遷移）。a11y のため土台ではなくリンク/ボタン自体に role を持たせる。
  if ('href' in props && props.href !== undefined) {
    if (disabled) {
      // disabled なリンクは aria-disabled＋クリック無効化（span でラップ）。
      return (
        <span className={outerCls} aria-disabled="true">
          {inner}
        </span>
      );
    }
    return (
      <Link href={props.href} aria-label={ariaLabel} className={outerCls}>
        {inner}
      </Link>
    );
  }

  // onClick / type → button
  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${outerCls} disabled:cursor-not-allowed`}
    >
      {inner}
    </button>
  );
}

export default PushButton;
