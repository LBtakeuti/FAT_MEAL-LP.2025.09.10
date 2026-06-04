import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import { excludedEmailsAsCsv, isExcludedEmail } from '@/lib/dashboard/excluded-emails';

type ChartEntry = {
  label: string;
  sortKey: string;
  subscriptionRevenue: number;
  subscriptionCount: number;
  oneTimeRevenue: number;
  total: number;
};

const JST_OFFSET = 9 * 60 * 60 * 1000;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function toJST(unixSec: number): Date {
  return new Date(unixSec * 1000 + JST_OFFSET);
}

function getLabel(jst: Date, type: string): string {
  if (type === 'daily') {
    return `${jst.getUTCMonth() + 1}/${jst.getUTCDate()}`;
  }
  if (type === 'weekly') {
    const dayOfWeek = jst.getUTCDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mon = new Date(jst.getTime() + diffToMon * 24 * 60 * 60 * 1000);
    const sun = new Date(mon.getTime() + 6 * 24 * 60 * 60 * 1000);
    return `${mon.getUTCMonth() + 1}/${mon.getUTCDate()}〜${sun.getUTCMonth() + 1}/${sun.getUTCDate()}`;
  }
  if (type === 'monthly') {
    return `${jst.getUTCFullYear()}/${String(jst.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return String(jst.getUTCFullYear());
}

function getSortKey(jst: Date, type: string): string {
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  if (type === 'daily') return `${y}-${m}-${d}`;
  if (type === 'weekly') {
    const dayOfWeek = jst.getUTCDay();
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mon = new Date(jst.getTime() + diffToMon * 24 * 60 * 60 * 1000);
    const my = mon.getUTCFullYear();
    const mm = String(mon.getUTCMonth() + 1).padStart(2, '0');
    const md = String(mon.getUTCDate()).padStart(2, '0');
    return `${my}-${mm}-${md}`;
  }
  if (type === 'monthly') return `${y}-${m}`;
  return `${y}`;
}

function ensureEntry(map: Map<string, ChartEntry>, label: string, sortKey: string): ChartEntry {
  if (!map.has(sortKey)) {
    map.set(sortKey, { label, sortKey, subscriptionRevenue: 0, subscriptionCount: 0, oneTimeRevenue: 0, total: 0 });
  }
  return map.get(sortKey)!;
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? 'monthly';
  const stripe = getStripe();

  try {
    const now = new Date();
    const jstNow = new Date(now.getTime() + JST_OFFSET);
    const year = jstNow.getUTCFullYear();
    const month = jstNow.getUTCMonth();

    let fromUnix: number;
    if (type === 'daily') {
      fromUnix = Math.floor((now.getTime() - 29 * 24 * 60 * 60 * 1000) / 1000);
    } else if (type === 'weekly') {
      fromUnix = Math.floor((now.getTime() - 83 * 24 * 60 * 60 * 1000) / 1000);
    } else if (type === 'monthly') {
      fromUnix = Math.floor(new Date('2026-01-01T00:00:00+09:00').getTime() / 1000);
    } else {
      fromUnix = 0; // 全期間
    }

    // 本サイトのサブスクIDをSupabaseから取得（本サイト以外のStripe履歴を除外するため）
    // F26: テスト/管理者の購入を除外するため shipping_address->>'email' も合わせて取得
    const supabase = createServerClient();
    const { data: dbSubs } = await (supabase.from('subscriptions') as any)
      .select('stripe_subscription_id, shipping_address');
    const dbSubsAll = (dbSubs || []) as Array<{ stripe_subscription_id: string | null; shipping_address: any }>;
    const ourSubIds = new Set<string>(
      dbSubsAll.map((s) => s.stripe_subscription_id).filter(Boolean) as string[],
    );
    // F26: 除外対象メールに紐づくサブスクIDを集合化
    const excludedSubIds = new Set<string>(
      dbSubsAll
        .filter((s) => isExcludedEmail(s.shipping_address?.email))
        .map((s) => s.stripe_subscription_id)
        .filter(Boolean) as string[],
    );

    const map = new Map<string, ChartEntry>();

    // サブスク売上: 本サイトのサブスクIDに一致するinvoiceのみ集計（除外対象は除く）
    let subInvoiceCount = 0;
    let totalInvoiceCount = 0;
    for await (const invoice of stripe.invoices.list({
      status: 'paid',
      created: fromUnix > 0 ? { gte: fromUnix } : undefined,
      limit: 100,
    })) {
      totalInvoiceCount++;
      const subId = (invoice as any).subscription || (invoice as any).parent?.subscription_details?.subscription;
      if (!subId || !ourSubIds.has(subId)) continue; // 本サイト以外を除外
      if (excludedSubIds.has(subId)) continue; // F26: テスト/管理者購入を除外
      subInvoiceCount++;
      const jst = toJST(invoice.created);
      const label = getLabel(jst, type);
      const sortKey = getSortKey(jst, type);
      const entry = ensureEntry(map, label, sortKey);
      entry.subscriptionRevenue += invoice.amount_paid;
      entry.subscriptionCount += 1;
      entry.total += invoice.amount_paid;
    }
    console.log(`[revenue-chart] type=${type} invoices: total=${totalInvoiceCount} sub=${subInvoiceCount} (filtered by ${ourSubIds.size} site sub IDs, ${excludedSubIds.size} excluded)`);

    // F26: 買い切り売上を orders テーブルベースに変更
    // （旧: Stripe Checkout Session only → 新: orders amount>0 かつ sub_delivery_ 以外）
    const ordersFromIso = fromUnix > 0 ? new Date(fromUnix * 1000).toISOString() : undefined;
    let ordersQuery = (supabase.from('orders') as any)
      .select('amount, created_at, customer_email')
      .gt('amount', 0)
      .not('stripe_session_id', 'like', 'sub_delivery_%')
      .not('customer_email', 'in', excludedEmailsAsCsv()); // F26: テスト/管理者購入を除外
    if (ordersFromIso) ordersQuery = ordersQuery.gte('created_at', ordersFromIso);
    const { data: oneTimeOrders } = await ordersQuery;
    for (const order of (oneTimeOrders || []) as Array<{ amount: number | null; created_at: string }>) {
      const ts = new Date(order.created_at).getTime();
      if (Number.isNaN(ts)) continue;
      const jst = toJST(Math.floor(ts / 1000));
      const label = getLabel(jst, type);
      const sortKey = getSortKey(jst, type);
      const entry = ensureEntry(map, label, sortKey);
      const amount = order.amount ?? 0;
      entry.oneTimeRevenue += amount;
      entry.total += amount;
    }

    const result = Array.from(map.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    return NextResponse.json(result);
  } catch (error) {
    console.error('revenue-chart error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
