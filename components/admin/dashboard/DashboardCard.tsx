'use client';

import React from 'react';
import Link from 'next/link';

type IconComponent = React.ComponentType<{ className?: string }>;

interface DashboardCardProps {
  title: string;
  value: string;
  hint?: string;
  icon?: IconComponent;
  accent?: 'teal' | 'orange' | 'purple' | 'amber' | 'indigo' | 'rose';
  loading?: boolean;
  rangePicker?: React.ReactNode;
  /** F32: 指定時はカード全体がクリッカブルになり、ホバーで影が強調される */
  href?: string;
}

const accentClasses: Record<NonNullable<DashboardCardProps['accent']>, string> = {
  teal: 'bg-teal-50 text-teal-700',
  orange: 'bg-orange-50 text-orange-700',
  purple: 'bg-purple-50 text-purple-700',
  amber: 'bg-amber-50 text-amber-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  rose: 'bg-rose-50 text-rose-700',
};

const valueClasses: Record<NonNullable<DashboardCardProps['accent']>, string> = {
  teal: 'text-teal-900',
  orange: 'text-orange-900',
  purple: 'text-purple-900',
  amber: 'text-amber-900',
  indigo: 'text-indigo-900',
  rose: 'text-rose-900',
};

export function DashboardCard({
  title,
  value,
  hint,
  icon: Icon,
  accent = 'orange',
  loading = false,
  rangePicker,
  href,
}: DashboardCardProps) {
  const interactiveClasses = href
    ? 'cursor-pointer hover:shadow-md transition-shadow'
    : '';
  const content = (
    <div
      className={`p-5 rounded-lg shadow flex flex-col gap-2 ${accentClasses[accent]} ${interactiveClasses}`}
    >
      <div className="flex items-center gap-2 text-xs">
        {Icon && <Icon className="w-4 h-4" />}
        <span className="font-medium">{title}</span>
      </div>
      <div className={`text-2xl font-bold ${valueClasses[accent]}`}>
        {loading ? '…' : value}
      </div>
      {hint && <div className="text-[11px] opacity-75">{hint}</div>}
      {rangePicker && <div className="mt-2">{rangePicker}</div>}
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
