import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import { excludedEmailsAsCsv, isExcludedEmail } from '@/lib/dashboard/excluded-emails';

const JST_OFFSET = 9 * 60 * 60 * 1000;

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function jstNow(): Date {
  return new Date(Date.now() + JST_OFFSET);
}

function jstDateBoundary(dateStr: string, endOfDay = false): string {
  return endOfDay ? `${dateStr}T23:59:59+09:00` : `${dateStr}T00:00:00+09:00`;
}

function jstDateBoundaryUnix(dateStr: string, endOfDay = false): number {
  return Math.floor(new Date(jstDateBoundary(dateStr, endOfDay)).getTime() / 1000);
}

function formatJstDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/**
 * F30: 管理ダッシュボード集約 API（範囲指定対応）
 *
 * クエリ:
 *   - from / to: 任意（YYYY-MM-DD, JST）。指定なし時は当月（JST 月初〜今日）
 *
 * 連動項目（範囲指定で変動）:
 *   - rangeRevenue: 範囲内のサブスク + 買い切り売上
 *   - newSubscriptionCount: 範囲内の新規サブスク件数
 *   - cancellationCount: 範囲内の解約件数
 *   - rangeDeliveriesCount: 範囲内の配送予定（pending）件数
 *
 * 固定項目（範囲指定無視、現時点固定）:
 *   - nextMonthSubscriptionForecast: 現時点 active サブスクの monthly_total_amount 合計
 *   - activeSubscriptionCount: 現時点 active サブスク数
 *   - pendingContactsCount: 現時点 pending お問い合わせ数
 *   - popularArticles: 累計閲覧数 Top5（view_count は累計値のため範囲不可）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const stripe = getStripe();
    const sp = request.nextUrl.searchParams;
    const fromParam = sp.get('from');
    const toParam = sp.get('to');

    const now = jstNow();
    const curYear = now.getUTCFullYear();
    const curMonth = now.getUTCMonth();
    const todayStr = formatJstDate(now);
    const curMonthFirst = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-01`;

    // 既定範囲: JST 月初 〜 JST 今日
    const rangeFrom = fromParam ?? curMonthFirst;
    const rangeTo = toParam ?? todayStr;

    // 本サイトのサブスクIDを取得（除外メール対応）
    const { data: dbSubs } = await (supabase.from('subscriptions') as any)
      .select('stripe_subscription_id, status, monthly_total_amount, created_at, shipping_address');
    const dbSubsAll = (dbSubs || []) as Array<any>;
    const nonExcludedSubs = dbSubsAll.filter((s) => !isExcludedEmail(s.shipping_address?.email));
    const ourSubIds = new Set<string>(
      nonExcludedSubs.map((s: any) => s.stripe_subscription_id).filter(Boolean),
    );
    const activeSubs = nonExcludedSubs.filter((s: any) => s.status === 'active');

    // 連動①: 範囲内の売上（サブスク + 買い切り）
    let rangeRevenue = 0;
    try {
      const gteUnix = jstDateBoundaryUnix(rangeFrom);
      const lteUnix = jstDateBoundaryUnix(rangeTo, true);
      let subRevenue = 0;
      for await (const inv of stripe.invoices.list({
        status: 'paid',
        created: { gte: gteUnix, lte: lteUnix },
        limit: 100,
      })) {
        const subId = (inv as any).subscription || (inv as any).parent?.subscription_details?.subscription;
        if (!subId || !ourSubIds.has(subId)) continue;
        subRevenue += inv.amount_paid;
      }
      const { data: rangeOrders } = await (supabase.from('orders') as any)
        .select('amount')
        .gt('amount', 0)
        .not('stripe_session_id', 'like', 'sub_delivery_%')
        .not('customer_email', 'in', excludedEmailsAsCsv())
        .gte('created_at', jstDateBoundary(rangeFrom))
        .lte('created_at', jstDateBoundary(rangeTo, true));
      const oneTimeRevenue = (rangeOrders || []).reduce((s: number, o: any) => s + (o.amount ?? 0), 0);
      rangeRevenue = subRevenue + oneTimeRevenue;
    } catch (err) {
      console.error('[dashboard/summary] rangeRevenue error', err);
    }

    // 固定②: 来月のサブスク見込み売上（現時点 active から）
    const nextMonthSubscriptionForecast = activeSubs.reduce(
      (sum: number, s: any) => sum + (s.monthly_total_amount || 0),
      0,
    );

    // 固定③: アクティブサブスク数（現時点）
    const activeSubscriptionCount = activeSubs.length;

    // 連動④: 範囲内の新規サブスク契約数
    let newSubscriptionCount = 0;
    try {
      const { data: rangeSubs } = await (supabase.from('subscriptions') as any)
        .select('id, shipping_address')
        .gte('created_at', jstDateBoundary(rangeFrom))
        .lte('created_at', jstDateBoundary(rangeTo, true));
      newSubscriptionCount = ((rangeSubs || []) as Array<any>)
        .filter((s) => !isExcludedEmail(s.shipping_address?.email))
        .length;
    } catch (err) {
      console.error('[dashboard/summary] newSubscriptionCount error', err);
    }

    // 連動④: 範囲内の解約数
    let cancellationCount = 0;
    try {
      const { count } = await (supabase.from('subscription_cancellation_requests') as any)
        .select('id', { count: 'exact', head: true })
        .not('customer_email', 'in', excludedEmailsAsCsv())
        .gte('created_at', jstDateBoundary(rangeFrom))
        .lte('created_at', jstDateBoundary(rangeTo, true));
      cancellationCount = count ?? 0;
    } catch (err) {
      console.error('[dashboard/summary] cancellationCount error', err);
    }

    // 連動④-b: 範囲内のお試し購入数（F34）
    // orders から amount > 0 / 非サブスク配送 / 除外メール除外 / menu_set にお試しを含む
    let trialPurchaseCount = 0;
    try {
      const { count } = await (supabase.from('orders') as any)
        .select('id', { count: 'exact', head: true })
        .gt('amount', 0)
        .not('stripe_session_id', 'like', 'sub_delivery_%')
        .not('customer_email', 'in', excludedEmailsAsCsv())
        .ilike('menu_set', '%お試し%')
        .gte('created_at', jstDateBoundary(rangeFrom))
        .lte('created_at', jstDateBoundary(rangeTo, true));
      trialPurchaseCount = count ?? 0;
    } catch (err) {
      console.error('[dashboard/summary] trialPurchaseCount error', err);
    }

    // 連動⑤: 範囲内の配送予定件数（subscription_deliveries.scheduled_date は date 型 = JST 解釈）
    let rangeDeliveriesCount = 0;
    try {
      const { count } = await (supabase.from('subscription_deliveries') as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('scheduled_date', rangeFrom)
        .lte('scheduled_date', rangeTo);
      rangeDeliveriesCount = count ?? 0;
    } catch (err) {
      console.error('[dashboard/summary] rangeDeliveriesCount error', err);
    }

    // 固定⑥: 未対応お問い合わせ数（現時点）
    let pendingContactsCount = 0;
    try {
      const { count } = await (supabase.from('contacts') as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      pendingContactsCount = count ?? 0;
    } catch (err) {
      console.error('[dashboard/summary] pendingContactsCount error', err);
    }

    // 固定⑧: 記事閲覧ランキング Top5（累計値、範囲対応不可）
    let popularArticles: Array<{ id: string; slug: string; title: string; view_count: number }> = [];
    try {
      const { data } = await (supabase.from('articles') as any)
        .select('id, slug, title, view_count')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(5);
      popularArticles = (data || []).map((a: any) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        view_count: a.view_count ?? 0,
      }));
    } catch (err) {
      console.error('[dashboard/summary] popularArticles error', err);
    }

    return NextResponse.json({
      // 連動項目
      rangeRevenue,
      newSubscriptionCount,
      cancellationCount,
      trialPurchaseCount,
      rangeDeliveriesCount,
      // 固定項目
      nextMonthSubscriptionForecast,
      activeSubscriptionCount,
      pendingContactsCount,
      popularArticles,
      // 範囲情報
      range: { from: rangeFrom, to: rangeTo },
    });
  } catch (error) {
    console.error('[dashboard/summary] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
