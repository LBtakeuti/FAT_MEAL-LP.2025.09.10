import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { predictDeliveries } from '@/lib/delivery-prediction';
import { resolveDeliveryWorkDate } from '@/lib/business-days';

interface DayItem {
  source: 'subscription' | 'order' | 'tiktok';
  customer_name: string;
  plan_name: string;
  status: string;
  predicted: boolean;
  // F2: 各 item に「配送希望日」を持たせ、UI で最も目立つように表示する
  preferred_delivery_date: string | null;
  // F7-3: cell.items の安定した昇順ソート用。予測アイテムは created_at を持たないため null
  created_at: string | null;
}

interface DayCount {
  date: string;
  actual_count: number;
  predicted_count: number;
  has_overdue: boolean;
  items: DayItem[];
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function planLabel(planName: string | null | undefined, source: 'subscription' | 'order' | 'tiktok'): string {
  if (planName) {
    const map: Record<string, string> = {
      'trial-6': 'お試しプラン',
      'sub-6': '6食プラン',
      'sub-12': '12食プラン',
      'subscription-monthly-12': '12食プラン（旧価格）', // legacy
    };
    return map[planName] || planName;
  }
  if (source === 'order') return 'お試し';
  if (source === 'tiktok') return 'TikTok';
  return '';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient() as any;
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '', 10);
    const month = parseInt(searchParams.get('month') || '', 10);

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'year/month required' }, { status: 400 });
    }

    const fromDate = new Date(year, month - 1, 1);
    const toDate = new Date(year, month, 0); // 月末
    const monthFrom = ymd(fromDate);
    const monthTo = ymd(toDate);
    // F4-3: クエリ範囲は表示月の前後1日まで拡張。
    //   resolveDeliveryWorkDate により注文がスライドして翌月初日や前月末日のセルに入る可能性があり、
    //   表示月ぴったりでクエリすると「月境界をまたいでスライドする注文」が拾えないため。
    //   日数配列は最終的に表示月のみで構築するので、余分に取得しても UI には影響しない。
    const from = ymd(new Date(year, month - 1, 0)); // 前月末日
    const to = ymd(new Date(year, month, 1)); // 翌月1日

    const todayJST = ymd(new Date(Date.now() + 9 * 60 * 60 * 1000));

    const cells = new Map<string, { actual: number; predicted: number; pendingPast: boolean; items: DayItem[] }>();
    const ensure = (date: string) => {
      if (!cells.has(date)) cells.set(date, { actual: 0, predicted: 0, pendingPast: false, items: [] });
      return cells.get(date)!;
    };

    // 1. subscription_deliveries
    // F4: セル配置基準は「配送作業日」（created_at から JST 10:00 を境に翌営業日へスライド）。
    //     各 item は preferred_delivery_date（ユーザー希望日）を保持し、UI で目立つように表示する。
    const { data: subDeliveries } = await supabase
      .from('subscription_deliveries')
      .select('created_at, scheduled_date, preferred_delivery_date, status, subscriptions(plan_name, shipping_address)')
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59`);
    for (const d of subDeliveries || []) {
      const workDate = resolveDeliveryWorkDate(new Date(d.created_at));
      const cell = ensure(workDate);
      cell.actual += 1;
      const preferred = d.preferred_delivery_date ?? d.scheduled_date;
      if (preferred <= todayJST && d.status !== 'shipped') cell.pendingPast = true;
      const sub = d.subscriptions || {};
      const addr = sub.shipping_address || {};
      cell.items.push({
        source: 'subscription',
        customer_name: addr.name || 'お客様',
        plan_name: planLabel(sub.plan_name, 'subscription'),
        status: d.status,
        predicted: false,
        preferred_delivery_date: preferred,
        created_at: d.created_at,
      });
    }

    // 2. orders
    // F4: セル配置基準は「配送作業日」。preferred_delivery_date は item に持たせて UI で強調。
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, preferred_delivery_date, status, stripe_session_id, customer_name, menu_set')
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59`);
    for (const o of orders || []) {
      if (typeof o.stripe_session_id === 'string' && o.stripe_session_id.startsWith('sub_delivery_')) continue;
      const workDate = resolveDeliveryWorkDate(new Date(o.created_at));
      const cell = ensure(workDate);
      cell.actual += 1;
      const preferred = o.preferred_delivery_date ?? workDate;
      if (preferred <= todayJST && o.status !== 'shipped' && o.status !== 'delivered') cell.pendingPast = true;
      cell.items.push({
        source: 'order',
        customer_name: o.customer_name || 'お客様',
        // F7-1: お試しは preferred_delivery_date を UI 表示しないため、API レスポンスでも null を返す
        plan_name: planLabel(o.menu_set, 'order'),
        status: o.status || 'pending',
        predicted: false,
        preferred_delivery_date: null,
        created_at: o.created_at,
      });
    }

    // 3. tiktok_shop_orders（preferred_delivery_date 概念なし。配送作業日基準で配置）
    const { data: tiktok } = await supabase
      .from('tiktok_shop_orders')
      .select('created_time, status, recipient, last_name, first_name, product_name')
      .gte('created_time', `${from}T00:00:00`)
      .lte('created_time', `${to}T23:59:59`);
    for (const t of tiktok || []) {
      const workDate = resolveDeliveryWorkDate(new Date(String(t.created_time)));
      const cell = ensure(workDate);
      cell.actual += 1;
      if (workDate <= todayJST && t.status !== 'shipped') cell.pendingPast = true;
      const name = t.recipient || [t.last_name, t.first_name].filter(Boolean).join(' ') || 'お客様';
      cell.items.push({
        source: 'tiktok',
        customer_name: name,
        plan_name: planLabel(t.product_name, 'tiktok'),
        status: t.status || 'pending',
        predicted: false,
        preferred_delivery_date: null,
        created_at: t.created_time ? String(t.created_time) : null,
      });
    }

    // 4. 未来予測（アクティブサブから）
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('id, stripe_subscription_id, plan_id, plan_name, current_period_end, shipping_address')
      .eq('status', 'active');
    const subIds = (activeSubs || []).map((s: { id: string }) => s.id);
    const existingByPid = new Map<string, Set<string>>();
    if (subIds.length > 0) {
      const { data: existing } = await supabase
        .from('subscription_deliveries')
        .select('subscription_id, scheduled_date')
        .in('subscription_id', subIds);
      for (const d of existing || []) {
        const key = d.subscription_id as string;
        if (!existingByPid.has(key)) existingByPid.set(key, new Set());
        existingByPid.get(key)!.add(d.scheduled_date as string);
      }
    }
    // 予測は表示月の範囲で生成（クエリ範囲を広げた from/to ではなく monthFrom/monthTo を使う）
    const predicted = predictDeliveries(activeSubs || [], existingByPid, monthFrom, monthTo);
    for (const p of predicted) {
      const cell = ensure(p.date);
      cell.predicted += 1;
      cell.items.push({
        source: 'subscription',
        customer_name: p.customer_name,
        plan_name: planLabel(p.plan_name, 'subscription'),
        status: 'predicted',
        predicted: true,
        // 予測は予測日 = 配送希望日として扱う
        preferred_delivery_date: p.date,
        created_at: null,
      });
    }

    // days 配列を date 順に作成
    // F7-3: cell.items は created_at 昇順（早く注文が入った順）でソートして返す。
    //       予測（created_at = null）は最後尾に置き、UI 側でも先頭3件＋「他N件」の出し分けに使う。
    const days: DayCount[] = [];
    for (let day = 1; day <= toDate.getDate(); day++) {
      const dateStr = ymd(new Date(year, month - 1, day));
      const c = cells.get(dateStr) || { actual: 0, predicted: 0, pendingPast: false, items: [] };
      const sorted = [...c.items].sort((a, b) => {
        if (a.created_at && b.created_at) return a.created_at.localeCompare(b.created_at);
        if (a.created_at) return -1;
        if (b.created_at) return 1;
        return 0;
      });
      days.push({
        date: dateStr,
        actual_count: c.actual,
        predicted_count: c.predicted,
        has_overdue: c.pendingPast,
        items: sorted,
      });
    }

    return NextResponse.json({ year, month, days });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
