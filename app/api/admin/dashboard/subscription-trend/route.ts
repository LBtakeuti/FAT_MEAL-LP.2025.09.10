import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const JST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * F15: ダッシュボード用サブスク契約数推移 API
 *
 * クエリ:
 *   - type: 'monthly'（既定）。現状は monthly のみ対応
 *   - months: 表示月数（既定 12、最大 24）
 *
 * 返却: [{ label: '2026/01', sortKey: '2026-01', count: 3 }, ...]
 *   - subscriptions テーブルの created_at を JST 月単位で集計
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const type = request.nextUrl.searchParams.get('type') ?? 'monthly';
    if (type !== 'monthly') {
      return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    }
    const monthsRaw = parseInt(request.nextUrl.searchParams.get('months') ?? '12', 10);
    const months = Math.min(Math.max(1, Number.isFinite(monthsRaw) ? monthsRaw : 12), 24);

    const now = new Date(Date.now() + JST_OFFSET);
    const curYear = now.getUTCFullYear();
    const curMonth = now.getUTCMonth();
    const oldest = new Date(Date.UTC(curYear, curMonth - (months - 1), 1) - JST_OFFSET);

    const { data: subs, error } = await (supabase.from('subscriptions') as any)
      .select('created_at')
      .gte('created_at', oldest.toISOString());

    if (error) {
      console.error('[dashboard/subscription-trend] supabase error', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    const buckets = new Map<string, { label: string; sortKey: string; count: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(Date.UTC(curYear, curMonth - (months - 1 - i), 1));
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const sortKey = `${y}-${m}`;
      buckets.set(sortKey, { label: `${y}/${m}`, sortKey, count: 0 });
    }

    for (const row of subs || []) {
      if (!row.created_at) continue;
      const created = new Date(new Date(row.created_at).getTime() + JST_OFFSET);
      const y = created.getUTCFullYear();
      const m = String(created.getUTCMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const bucket = buckets.get(key);
      if (bucket) bucket.count += 1;
    }

    const result = Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[dashboard/subscription-trend] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
