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

function jstMonthRangeUnix(year: number, monthZeroBased: number): { gte: number; lt: number } {
  const startUtc = Date.UTC(year, monthZeroBased, 1) - JST_OFFSET;
  const endUtc = Date.UTC(year, monthZeroBased + 1, 1) - JST_OFFSET;
  return { gte: Math.floor(startUtc / 1000), lt: Math.floor(endUtc / 1000) };
}

function jstDateBoundary(dateStr: string, endOfDay = false): string {
  return endOfDay ? `${dateStr}T23:59:59+09:00` : `${dateStr}T00:00:00+09:00`;
}

/**
 * F15: 管理ダッシュボード集約 API
 *
 * クエリ:
 *   - from / to: 任意（YYYY-MM-DD）。指定なし時は「全期間」または「今月」として扱う
 *
 * 返却:
 *   - currentMonthRevenue: 今月のサブスク売上 + 買い切り売上（月固定）
 *   - nextMonthSubscriptionForecast: active subscriptions の monthly_total_amount 合計
 *   - allTimeRevenue: from/to で絞った総売上（指定なし: 全期間）
 *   - newSubscriptionCount: from/to で絞った新規 subscriptions 件数（指定なし: 今月）
 *   - cancellationCount: from/to で絞った subscription_cancellation_requests 件数（指定なし: 今月）
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const stripe = getStripe();
    const sp = request.nextUrl.searchParams;
    const fromParam = sp.get('from'); // YYYY-MM-DD or null
    const toParam = sp.get('to'); // YYYY-MM-DD or null

    const now = jstNow();
    const curYear = now.getUTCFullYear();
    const curMonth = now.getUTCMonth();
    const curMonthFirst = `${curYear}-${String(curMonth + 1).padStart(2, '0')}-01`;
    const nextMonthFirstDate = new Date(Date.UTC(curYear, curMonth + 1, 1));
    const curMonthLast = new Date(nextMonthFirstDate.getTime() - 24 * 60 * 60 * 1000);
    const curMonthLastStr = `${curMonthLast.getUTCFullYear()}-${String(curMonthLast.getUTCMonth() + 1).padStart(2, '0')}-${String(curMonthLast.getUTCDate()).padStart(2, '0')}`;

    // 本サイトのサブスクIDを取得（Stripeフィルタの正）
    // F26: 除外対象メールに紐づくサブスクIDを別集合化して invoice 集計時に除外
    const { data: dbSubs } = await (supabase.from('subscriptions') as any)
      .select('stripe_subscription_id, status, monthly_total_amount, created_at, shipping_address');
    const dbSubsAll = (dbSubs || []) as Array<any>;
    const nonExcludedSubs = dbSubsAll.filter((s) => !isExcludedEmail(s.shipping_address?.email));
    const ourSubIds = new Set<string>(
      nonExcludedSubs.map((s: any) => s.stripe_subscription_id).filter(Boolean),
    );
    const activeSubs = nonExcludedSubs.filter((s: any) => s.status === 'active');

    // ① 今月の売上（サブスク + 買い切り）
    let currentMonthRevenue = 0;
    try {
      const { gte, lt } = jstMonthRangeUnix(curYear, curMonth);
      let subRevenue = 0;
      for await (const inv of stripe.invoices.list({ status: 'paid', created: { gte, lt }, limit: 100 })) {
        const subId = (inv as any).subscription || (inv as any).parent?.subscription_details?.subscription;
        if (!subId || !ourSubIds.has(subId)) continue;
        subRevenue += inv.amount_paid;
      }
      const { data: monthOrders } = await (supabase.from('orders') as any)
        .select('amount')
        .gt('amount', 0)
        .not('stripe_session_id', 'like', 'sub_delivery_%')
        .not('customer_email', 'in', excludedEmailsAsCsv())
        .gte('created_at', jstDateBoundary(curMonthFirst))
        .lte('created_at', jstDateBoundary(curMonthLastStr, true));
      const oneTimeRevenue = (monthOrders || []).reduce((s: number, o: any) => s + (o.amount ?? 0), 0);
      currentMonthRevenue = subRevenue + oneTimeRevenue;
    } catch (err) {
      console.error('[dashboard/summary] currentMonthRevenue error', err);
    }

    // ② 来月のサブスク見込み売上
    const nextMonthSubscriptionForecast = activeSubs.reduce(
      (sum: number, s: any) => sum + (s.monthly_total_amount || 0),
      0,
    );

    // ③ 累計売上（from/to 指定があればその範囲、なければ全期間）
    let allTimeRevenue = 0;
    try {
      let subRevenue = 0;
      const stripeCreated: Stripe.InvoiceListParams['created'] | undefined =
        fromParam || toParam
          ? {
              ...(fromParam ? { gte: Math.floor(new Date(jstDateBoundary(fromParam)).getTime() / 1000) } : {}),
              ...(toParam ? { lte: Math.floor(new Date(jstDateBoundary(toParam, true)).getTime() / 1000) } : {}),
            }
          : undefined;
      for await (const inv of stripe.invoices.list({ status: 'paid', created: stripeCreated, limit: 100 })) {
        const subId = (inv as any).subscription || (inv as any).parent?.subscription_details?.subscription;
        if (!subId || !ourSubIds.has(subId)) continue;
        subRevenue += inv.amount_paid;
      }
      let ordersQuery = (supabase.from('orders') as any)
        .select('amount')
        .gt('amount', 0)
        .not('stripe_session_id', 'like', 'sub_delivery_%')
        .not('customer_email', 'in', excludedEmailsAsCsv());
      if (fromParam) ordersQuery = ordersQuery.gte('created_at', jstDateBoundary(fromParam));
      if (toParam) ordersQuery = ordersQuery.lte('created_at', jstDateBoundary(toParam, true));
      const { data: rangeOrders } = await ordersQuery;
      const oneTimeRevenue = (rangeOrders || []).reduce((s: number, o: any) => s + (o.amount ?? 0), 0);
      allTimeRevenue = subRevenue + oneTimeRevenue;
    } catch (err) {
      console.error('[dashboard/summary] allTimeRevenue error', err);
    }

    // ④ 新規サブスク契約数（from/to 指定なし時は今月）
    // F26: shipping_address->>'email' で除外対象を弾くため一度フェッチして JS 側でカウント
    let newSubscriptionCount = 0;
    try {
      const subFrom = fromParam ?? curMonthFirst;
      const subTo = toParam ?? curMonthLastStr;
      const { data: rangeSubs } = await (supabase.from('subscriptions') as any)
        .select('id, shipping_address')
        .gte('created_at', jstDateBoundary(subFrom))
        .lte('created_at', jstDateBoundary(subTo, true));
      newSubscriptionCount = ((rangeSubs || []) as Array<any>)
        .filter((s) => !isExcludedEmail(s.shipping_address?.email))
        .length;
    } catch (err) {
      console.error('[dashboard/summary] newSubscriptionCount error', err);
    }

    // ⑤ 解約数（from/to 指定なし時は今月）
    let cancellationCount = 0;
    try {
      const cFrom = fromParam ?? curMonthFirst;
      const cTo = toParam ?? curMonthLastStr;
      const { count } = await (supabase.from('subscription_cancellation_requests') as any)
        .select('id', { count: 'exact', head: true })
        .not('customer_email', 'in', excludedEmailsAsCsv())
        .gte('created_at', jstDateBoundary(cFrom))
        .lte('created_at', jstDateBoundary(cTo, true));
      cancellationCount = count ?? 0;
    } catch (err) {
      console.error('[dashboard/summary] cancellationCount error', err);
    }

    // F29: アクティブサブスク数
    const activeSubscriptionCount = activeSubs.length;

    // F29: 今週の配送予定（pending かつ JST 今日〜+7日）
    let upcomingDeliveriesCount = 0;
    try {
      const today = new Date(Date.UTC(curYear, curMonth, now.getUTCDate()));
      const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const todayStr = today.toISOString().slice(0, 10);
      const weekLaterStr = weekLater.toISOString().slice(0, 10);
      const { count } = await (supabase.from('subscription_deliveries') as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('scheduled_date', todayStr)
        .lt('scheduled_date', weekLaterStr);
      upcomingDeliveriesCount = count ?? 0;
    } catch (err) {
      console.error('[dashboard/summary] upcomingDeliveriesCount error', err);
    }

    // F29: 未対応お問い合わせ数
    let pendingContactsCount = 0;
    try {
      const { count } = await (supabase.from('contacts') as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      pendingContactsCount = count ?? 0;
    } catch (err) {
      console.error('[dashboard/summary] pendingContactsCount error', err);
    }

    // F29: 記事閲覧ランキング Top5（公開済み記事のみ）
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
      currentMonthRevenue,
      nextMonthSubscriptionForecast,
      allTimeRevenue,
      newSubscriptionCount,
      cancellationCount,
      activeSubscriptionCount,
      upcomingDeliveriesCount,
      pendingContactsCount,
      popularArticles,
      ranges: {
        currentMonth: { from: curMonthFirst, to: curMonthLastStr },
        applied: {
          allTime: { from: fromParam, to: toParam },
          newSubscription: { from: fromParam ?? curMonthFirst, to: toParam ?? curMonthLastStr },
          cancellation: { from: fromParam ?? curMonthFirst, to: toParam ?? curMonthLastStr },
        },
      },
    });
  } catch (error) {
    console.error('[dashboard/summary] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
