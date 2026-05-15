import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { predictDeliveries } from '@/lib/delivery-prediction';

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
    const from = ymd(fromDate);
    const to = ymd(toDate);

    const todayJST = ymd(new Date(Date.now() + 9 * 60 * 60 * 1000));

    const cells = new Map<string, { actual: number; predicted: number; pendingPast: boolean; items: DayItem[] }>();
    const ensure = (date: string) => {
      if (!cells.has(date)) cells.set(date, { actual: 0, predicted: 0, pendingPast: false, items: [] });
      return cells.get(date)!;
    };

    // 1. subscription_deliveries（顧客名・プラン名を含めて取得）
    const { data: subDeliveries } = await supabase
      .from('subscription_deliveries')
      .select('scheduled_date, status, subscriptions(plan_name, shipping_address)')
      .gte('scheduled_date', from)
      .lte('scheduled_date', to);
    for (const d of subDeliveries || []) {
      const cell = ensure(d.scheduled_date);
      cell.actual += 1;
      if (d.scheduled_date <= todayJST && d.status !== 'shipped') cell.pendingPast = true;
      const sub = d.subscriptions || {};
      const addr = sub.shipping_address || {};
      cell.items.push({
        source: 'subscription',
        customer_name: addr.name || 'お客様',
        plan_name: planLabel(sub.plan_name, 'subscription'),
        status: d.status,
        predicted: false,
      });
    }

    // 2. orders
    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, status, stripe_session_id, customer_name, menu_set')
      .gte('created_at', `${from}T00:00:00`)
      .lte('created_at', `${to}T23:59:59`);
    for (const o of orders || []) {
      if (typeof o.stripe_session_id === 'string' && o.stripe_session_id.startsWith('sub_delivery_')) continue;
      const date = String(o.created_at).slice(0, 10);
      const cell = ensure(date);
      cell.actual += 1;
      if (date <= todayJST && o.status !== 'shipped' && o.status !== 'delivered') cell.pendingPast = true;
      cell.items.push({
        source: 'order',
        customer_name: o.customer_name || 'お客様',
        plan_name: planLabel(o.menu_set, 'order'),
        status: o.status || 'pending',
        predicted: false,
      });
    }

    // 3. tiktok_shop_orders
    const { data: tiktok } = await supabase
      .from('tiktok_shop_orders')
      .select('created_time, status, recipient, last_name, first_name, product_name')
      .gte('created_time', `${from}T00:00:00`)
      .lte('created_time', `${to}T23:59:59`);
    for (const t of tiktok || []) {
      const date = String(t.created_time).slice(0, 10);
      const cell = ensure(date);
      cell.actual += 1;
      if (date <= todayJST && t.status !== 'shipped') cell.pendingPast = true;
      const name = t.recipient || [t.last_name, t.first_name].filter(Boolean).join(' ') || 'お客様';
      cell.items.push({
        source: 'tiktok',
        customer_name: name,
        plan_name: planLabel(t.product_name, 'tiktok'),
        status: t.status || 'pending',
        predicted: false,
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
    const predicted = predictDeliveries(activeSubs || [], existingByPid, from, to);
    for (const p of predicted) {
      const cell = ensure(p.date);
      cell.predicted += 1;
      cell.items.push({
        source: 'subscription',
        customer_name: p.customer_name,
        plan_name: planLabel(p.plan_name, 'subscription'),
        status: 'predicted',
        predicted: true,
      });
    }

    // days 配列を date 順に作成
    const days: DayCount[] = [];
    for (let day = 1; day <= toDate.getDate(); day++) {
      const dateStr = ymd(new Date(year, month - 1, day));
      const c = cells.get(dateStr) || { actual: 0, predicted: 0, pendingPast: false, items: [] };
      // 1日あたり最大8件まで（多すぎる時はカレンダー UI で「+N件」表示）
      const items = c.items.slice(0, 8);
      days.push({
        date: dateStr,
        actual_count: c.actual,
        predicted_count: c.predicted,
        has_overdue: c.pendingPast,
        items,
      });
    }

    return NextResponse.json({ year, month, days });
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
