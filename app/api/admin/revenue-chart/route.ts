import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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

    const map = new Map<string, ChartEntry>();

    // サブスク売上: Stripe インボイス（subscription付き）
    let subInvoiceCount = 0;
    let totalInvoiceCount = 0;
    for await (const invoice of stripe.invoices.list({
      status: 'paid',
      created: fromUnix > 0 ? { gte: fromUnix } : undefined,
      limit: 100,
    })) {
      totalInvoiceCount++;
      const subId = (invoice as any).subscription || (invoice as any).parent?.subscription_details?.subscription;
      if (!subId) continue;
      subInvoiceCount++;
      const jst = toJST(invoice.created);
      const label = getLabel(jst, type);
      const sortKey = getSortKey(jst, type);
      const entry = ensureEntry(map, label, sortKey);
      entry.subscriptionRevenue += invoice.amount_paid;
      entry.subscriptionCount += 1;
      entry.total += invoice.amount_paid;
    }
    console.log(`[revenue-chart] type=${type} invoices: total=${totalInvoiceCount} sub=${subInvoiceCount}`);

    // 買い切り売上: checkout sessions (purchase_type=one-time)
    for await (const session of stripe.checkout.sessions.list({
      created: fromUnix > 0 ? { gte: fromUnix } : undefined,
      limit: 100,
    })) {
      if (
        session.payment_status !== 'paid' ||
        session.mode !== 'payment' ||
        session.metadata?.purchase_type !== 'one-time'
      ) continue;
      const jst = toJST(session.created);
      const label = getLabel(jst, type);
      const sortKey = getSortKey(jst, type);
      const entry = ensureEntry(map, label, sortKey);
      const amount = session.amount_total ?? 0;
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
