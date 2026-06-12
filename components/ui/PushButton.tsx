'use client';

import React from 'react';
import Link from 'next/link';

/**
 * F76: Uiverse "Voxybuns" 風の3D押し込みボタン（ブランドオレンジ）。
 *
 * 二層構造:
 * - 土台（outer）= 濃いオレンジ（orange-800）＝枠/影の役。border-radius を共有。
 * - 上面（inner span）= メインのオレンジ（orange-600）・白文字。translateY で浮かせ、
 *   hover でさらに浮き、active で沈む（土台に重なる）。
 *
 * ガード:
 * - 挙動は呼び出し側のまま（onClick / href / type）。<button>/<a>/<Link> を出し分け。
 * - a11y: フォーカスリングは土台に表示。disabled 時は沈み演出を無効化＋操作不可。
 * - prefers-reduced-motion: 動き（transform/transition）を抑制（motion-reduce）。
 * - transform のみのアニメで CLS なし。色はトークン（orange-600/700/800）のみ。
 */

type Variant = 'orange';
type Size = 'md' | 'lg' | 'full';

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
  | (CommonProps & { href?: undefined; onClick?: () => void; type?: 'button' | 'submit' });

const SIZE_INNER: Record<Size, string> = {
  md: 'px-5 py-2 text-sm lg:text-base',
  lg: 'px-8 py-3 text-base sm:text-lg',
  full: 'w-full py-3 text-base',
};

// 土台（outer）: 濃オレンジ。inner の浮き量(0.33em)ぶん下に余白を持たせ、押し込み代を作る。
const OUTER_BASE =
  'inline-block rounded-full bg-orange-800 p-0 align-bottom select-none ' +
  'focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-400 focus-within:ring-offset-2';

// 上面（inner）: メインオレンジ・白文字。浮き→hoverでさらに浮き→activeで沈む。
// reduced-motion では transition/translate を無効化（motion-reduce）。
const INNER_BASE =
  'block rounded-full bg-orange-600 text-white font-bold text-center whitespace-nowrap ' +
  'transition-transform duration-100 ease-out will-change-transform ' +
  '-translate-y-[0.2em] hover:-translate-y-[0.33em] active:translate-y-0 ' +
  'motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:hover:translate-y-0';

const INNER_DISABLED = 'block rounded-full bg-orange-600/60 text-white font-bold text-center whitespace-nowrap translate-y-0';

export function PushButton(props: PushButtonProps) {
  const { children, size = 'md', className = '', disabled = false } = props;
  const ariaLabel = props['aria-label'];

  const outerCls = `${OUTER_BASE} ${size === 'full' ? 'w-full' : ''} ${className}`.trim();
  const innerCls = `${disabled ? INNER_DISABLED : INNER_BASE} ${SIZE_INNER[size]}`;

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
