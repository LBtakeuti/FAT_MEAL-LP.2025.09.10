import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { isExcludedEmail } from '@/lib/dashboard/excluded-emails';

const JST_OFFSET = 9 * 60 * 60 * 1000;

/**
 * F15/F30: ダッシュボード用サブスク契約数推移 API
 *
 * クエリ:
 *   - type: 'monthly'（既定）
 *   - from / to: 任意（YYYY-MM-DD, JST）。指定時は範囲内の月別バケット
 *   - months: from/to 未指定時のみ有効。表示月数（既定 12、最大 24）
 *
 * 返却: [{ label: '2026/01', sortKey: '2026-01', count: 3 }, ...]
 *   - subscriptions テーブルの created_at を JST 月単位で集計
 *   - F26 除外メール（shipping_address->>'email'）は集計外
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const sp = request.nextUrl.searchParams;
    const type = sp.get('type') ?? 'monthly';
    if (type !== 'monthly') {
      return NextResponse.json({ error: 'Unsupported type' }, { status: 400 });
    }
    const fromParam = sp.get('from'); // YYYY-MM-DD
    const toParam = sp.get('to');

    const now = new Date(Date.now() + JST_OFFSET);

    // バケット範囲を決定
    let startYear: number;
    let startMonth: number;
    let endYear: number;
    let endMonth: number;

    if (fromParam) {
      const [y, m] = fromParam.split('-').map(Number);
      startYear = y;
      startMonth = (m ?? 1) - 1;
    } else {
      // months パラメータベース（既定 12）
      const monthsRaw = parseInt(sp.get('months') ?? '12', 10);
      const months = Math.min(Math.max(1, Number.isFinite(monthsRaw) ? monthsRaw : 12), 24);
      const startBase = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
      startYear = startBase.getUTCFullYear();
      startMonth = startBase.getUTCMonth();
    }

    if (toParam) {
      const [y, m] = toParam.split('-').map(Number);
      endYear = y;
      endMonth = (m ?? 1) - 1;
    } else {
      endYear = now.getUTCFullYear();
      endMonth = now.getUTCMonth();
    }

    // 開始 > 終了の場合はガード
    const startUtc = Date.UTC(startYear, startMonth, 1);
    const endUtc = Date.UTC(endYear, endMonth, 1);
    if (startUtc > endUtc) {
      return NextResponse.json([]);
    }

    const oldest = new Date(startUtc - JST_OFFSET);
    const nextAfterEnd = new Date(Date.UTC(endYear, endMonth + 1, 1) - JST_OFFSET);

    const { data: subs, error } = await (supabase.from('subscriptions') as any)
      .select('created_at, shipping_address')
      .gte('created_at', oldest.toISOString())
      .lt('created_at', nextAfterEnd.toISOString());

    if (error) {
      console.error('[dashboard/subscription-trend] supabase error', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    const buckets = new Map<string, { label: string; sortKey: string; count: number }>();
    let cursor = new Date(startUtc);
    const stop = new Date(endUtc);
    while (cursor.getTime() <= stop.getTime()) {
      const y = cursor.getUTCFullYear();
      const m = String(cursor.getUTCMonth() + 1).padStart(2, '0');
      const sortKey = `${y}-${m}`;
      buckets.set(sortKey, { label: `${y}/${m}`, sortKey, count: 0 });
      cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
    }

    for (const row of subs || []) {
      if (!row.created_at) continue;
      if (isExcludedEmail(row.shipping_address?.email)) continue;
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
