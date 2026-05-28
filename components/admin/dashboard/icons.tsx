import React from 'react';

interface IconProps {
  className?: string;
}

const baseProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function TrendingUpIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function PiggyBankIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-1.7 0-3.5 0-5 1-1 .7-1.5 1.7-2 3-1 2-1 3.5-1 5 0 2 1 3 2 4l1 2h3l1-2c1.5 0 3-1 4-2l2 .5V13c0-1 .5-2 1-3 0-1 0-2-2-3-1.5-.5-2-.5-3-2z" />
      <path d="M2 9v1c0 1.1.9 2 2 2h1" />
      <path d="M16 10h.01" />
    </svg>
  );
}

export function UserPlusIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}

export function UserMinusIcon({ className }: IconProps) {
  return (
    <svg {...baseProps} className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
