'use client';

import { useState } from 'react';
import { Button } from './Button';

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function preset(kind: 'thisWeek' | 'thisMonth' | 'nextMonth'): { from: string; to: string } {
  const now = new Date();
  if (kind === 'thisWeek') {
    const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
    const monday = new Date(now);
    const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(monday.getDate() + offsetToMonday);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { from: ymd(monday), to: ymd(sunday) };
  }
  if (kind === 'thisMonth') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: ymd(start), to: ymd(end) };
  }
  // nextMonth
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return { from: ymd(start), to: ymd(end) };
}

export function DateRangePicker({ from, to, onChange }: Props) {
  const [localFrom, setLocalFrom] = useState(from);
  const [localTo, setLocalTo] = useState(to);

  const apply = (f: string, t: string) => {
    setLocalFrom(f);
    setLocalTo(t);
    onChange(f, t);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 inline-flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={localFrom}
        onChange={(e) => setLocalFrom(e.target.value)}
        className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <span className="text-sm text-gray-500">〜</span>
      <input
        type="date"
        value={localTo}
        onChange={(e) => setLocalTo(e.target.value)}
        className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <Button size="sm" variant="primary" onClick={() => apply(localFrom, localTo)}>適用</Button>
      <span className="mx-1 text-gray-300">|</span>
      <Button size="sm" variant="ghost" onClick={() => { const r = preset('thisWeek'); apply(r.from, r.to); }}>今週</Button>
      <Button size="sm" variant="ghost" onClick={() => { const r = preset('thisMonth'); apply(r.from, r.to); }}>今月</Button>
      <Button size="sm" variant="ghost" onClick={() => { const r = preset('nextMonth'); apply(r.from, r.to); }}>来月</Button>
    </div>
  );
}
