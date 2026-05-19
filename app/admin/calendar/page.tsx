'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, LoadingSpinner } from '@/components/admin/ui';

interface DayItem {
  source: 'subscription' | 'order' | 'tiktok';
  customer_name: string;
  plan_name: string;
  status: string;
  predicted: boolean;
}

interface DayCount {
  date: string;
  actual_count: number;
  predicted_count: number;
  has_overdue: boolean;
  items: DayItem[];
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

const todayStr = () => new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function AdminCalendarPage() {
  const router = useRouter();
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [days, setDays] = useState<DayCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/delivery/calendar?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        setDays(data.days || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const prev = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const next = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };
  const thisMonth = () => {
    const n = new Date(Date.now() + 9 * 60 * 60 * 1000);
    setYear(n.getUTCFullYear());
    setMonth(n.getUTCMonth() + 1);
  };

  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay();
  const today = todayStr();

  const cells: (DayCount | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (const d of days) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const totalActual = days.reduce((s, d) => s + d.actual_count, 0);
  const totalPredicted = days.reduce((s, d) => s + d.predicted_count, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">配送カレンダー</h1>
      <p className="text-sm text-gray-500 mb-6">日付をクリックすると、その日の配送詳細（CSV出力可）が開きます</p>

      <div className="flex items-center gap-3 mb-4">
        <Button size="sm" variant="secondary" onClick={prev}>← 前月</Button>
        <h2 className="text-lg font-bold text-gray-800 min-w-[120px] text-center">{year}年{month}月</h2>
        <Button size="sm" variant="secondary" onClick={next}>次月 →</Button>
        <Button size="sm" variant="ghost" onClick={thisMonth}>今月</Button>
        <div className="ml-auto text-sm text-gray-600">
          実績 <strong>{totalActual}件</strong> / 予測 <strong className="italic">{totalPredicted}件</strong>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {WEEKDAY_LABELS.map((w, i) => (
              <div
                key={w}
                className={`px-2 py-2 text-center text-xs font-medium ${
                  i === 0 ? 'text-red-600' : i === 6 ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="min-h-[140px] border-r border-b border-gray-100 bg-gray-50/30" />;
              }
              const isToday = cell.date === today;
              const isPast = cell.date < today;
              const dayNum = parseInt(cell.date.slice(-2), 10);
              const dow = new Date(cell.date + 'T00:00:00').getDay();
              const total = cell.actual_count + cell.predicted_count;
              const visibleItems = cell.items.slice(0, 4);
              const hiddenCount = total - visibleItems.length;

              const goToDayDetail = () => router.push(`/admin/calendar/${cell.date}`);

              return (
                <div
                  key={cell.date}
                  className={`min-h-[140px] border-r border-b border-gray-100 p-1.5 flex flex-col cursor-pointer transition-colors hover:bg-orange-50 ${isToday ? 'ring-2 ring-orange-500 ring-inset bg-orange-50/40' : ''}`}
                  onClick={goToDayDetail}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') goToDayDetail(); }}
                >
                  <div className="flex items-start justify-between mb-1 px-1">
                    <span className={`text-xs font-bold ${
                      isToday ? 'text-orange-700' :
                      dow === 0 ? 'text-red-600' :
                      dow === 6 ? 'text-blue-600' :
                      isPast ? 'text-gray-400' : 'text-gray-700'
                    }`}>
                      {dayNum}
                    </span>
                    {cell.has_overdue && <span className="text-red-500 text-[10px]" title="未出荷あり">⚠</span>}
                  </div>

                  {visibleItems.length > 0 && (
                    <div className="flex-1 space-y-0.5 overflow-hidden">
                      {visibleItems.map((it, i) => (
                        <div
                          key={i}
                          className={`text-[11px] leading-tight px-1.5 py-0.5 rounded truncate ${
                            it.predicted
                              ? 'bg-gray-100 text-gray-500 italic'
                              : it.source === 'subscription'
                                ? 'bg-purple-100 text-purple-800'
                                : it.source === 'tiktok'
                                  ? 'bg-pink-100 text-pink-800'
                                  : 'bg-orange-100 text-orange-800'
                          }`}
                          title={`${it.customer_name} / ${it.plan_name}`}
                        >
                          <span className="font-medium">{it.customer_name}</span>
                          {it.plan_name && <span className="opacity-75"> · {it.plan_name}</span>}
                        </div>
                      ))}
                      {hiddenCount > 0 && (
                        <div className="text-[10px] text-gray-500 px-1.5">+{hiddenCount}件</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 flex flex-wrap gap-3">
            <span><span className="inline-block w-3 h-3 bg-purple-100 rounded mr-1 align-middle" />サブスク</span>
            <span><span className="inline-block w-3 h-3 bg-orange-100 rounded mr-1 align-middle" />お試し</span>
            <span><span className="inline-block w-3 h-3 bg-pink-100 rounded mr-1 align-middle" />TikTok</span>
            <span><span className="inline-block w-3 h-3 bg-gray-100 rounded mr-1 align-middle" /><span className="italic">予測</span></span>
            <span className="ml-auto">日付クリック → その日の配送詳細へ</span>
          </div>
        </div>
      )}
    </div>
  );
}
