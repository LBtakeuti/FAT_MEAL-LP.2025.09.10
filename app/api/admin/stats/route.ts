import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function GET() {
  try {
    const supabase = createServerClient();

    // 並列でデータを取得（ordersは別途エラーハンドリング）
    const [menuResult, newsResult, contactsResult, pendingContactsResult] = await Promise.all([
      supabase.from('menu_items').select('id, is_active'),
      supabase.from('news').select('id'),
      supabase.from('contacts').select('id'),
      supabase.from('contacts').select('id').eq('status', 'pending'),
    ]);

    // ordersテーブルは別途取得（エラーを無視）
    let pendingOrders: any[] = [];
    try {
      const ordersResult = await (supabase.from('orders') as any).select('id').eq('status', 'pending');
      pendingOrders = ordersResult.data || [];
    } catch {
      // ordersテーブルがない場合は空配列
      pendingOrders = [];
    }

    const menuItems = menuResult.data || [];
    const newsItems = newsResult.data || [];
    const contacts = contactsResult.data || [];
    const pendingContacts = pendingContactsResult.data || [];

    // 非公開メニュー数
    const inactiveMenuItems = menuItems.filter((item: any) => !item.is_active).length;

    // サブスクリプション統計を取得
    let activeSubscriptions = 0;
    let upcomingDeliveries = 0;

    try {
      // アクティブなサブスクリプション数
      const { count: activeCount } = await (supabase
        .from('subscriptions') as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      activeSubscriptions = activeCount || 0;

      // 今週配送予定の件数
      const now = new Date();
      const jstOffset = 9 * 60 * 60 * 1000;
      const jstNow = new Date(now.getTime() + jstOffset);
      const today = new Date(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate());
      const weekLater = new Date(today);
      weekLater.setDate(today.getDate() + 7);

      const todayStr = today.toISOString().split('T')[0];
      const weekLaterStr = weekLater.toISOString().split('T')[0];

      const { count: deliveriesCount } = await (supabase
        .from('subscription_deliveries') as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('scheduled_date', todayStr)
        .lt('scheduled_date', weekLaterStr);
      upcomingDeliveries = deliveriesCount || 0;
    } catch {
      // subscriptionsテーブルがない場合は0
      activeSubscriptions = 0;
      upcomingDeliveries = 0;
    }

    // 売上統計
    let todaySubscriptionRevenue = 0;
    let todayOneTimeRevenue = 0;
    let allTimeOneTimeRevenue = 0;
    let allTimeSubRevenue = 0;
    let nextMonthSubscriptionForecast = 0;

    // 今日のサブスク売上（Stripe invoices）
    try {
      const stripe = getStripe();
      const jstOffset = 9 * 60 * 60 * 1000;
      const jstNow = new Date(Date.now() + jstOffset);
      const year = jstNow.getUTCFullYear();
      const month = jstNow.getUTCMonth();
      const day = jstNow.getUTCDate();
      const todayStartUnix = Math.floor((Date.UTC(year, month, day) - jstOffset) / 1000);
      const todayEndUnix = Math.floor((Date.UTC(year, month, day + 1) - jstOffset) / 1000);

      const todayInvoices = await stripe.invoices.list({
        status: 'paid',
        created: { gte: todayStartUnix, lt: todayEndUnix },
        limit: 100,
      });
      todaySubscriptionRevenue = todayInvoices.data
        .filter((inv) => (inv as any).subscription)
        .reduce((sum, inv) => sum + inv.amount_paid, 0);
    } catch (err) {
      console.error('Stripe revenue stats error:', err);
    }

    // 今日の買い切り・累計売上（Supabase DB）
    try {
      const jstOffset = 9 * 60 * 60 * 1000;
      const jstNow = new Date(Date.now() + jstOffset);
      const todayStr = jstNow.toISOString().split('T')[0];

      // 今日の買い切り売上
      const { data: todayOrders } = await (supabase.from('orders') as any)
        .select('amount')
        .gt('amount', 0)
        .gte('created_at', `${todayStr}T00:00:00+09:00`)
        .lt('created_at', `${todayStr}T23:59:59+09:00`);
      todayOneTimeRevenue = (todayOrders || []).reduce((sum: number, o: any) => sum + (o.amount ?? 0), 0);

      // 累計買い切り売上
      const { data: allOrders } = await (supabase.from('orders') as any)
        .select('amount')
        .gt('amount', 0);
      allTimeOneTimeRevenue = (allOrders || []).reduce((sum: number, o: any) => sum + (o.amount ?? 0), 0);

      // 累計サブスク売上（配送済み件数 × 1配送単価）
      const { data: shippedDeliveries } = await (supabase
        .from('subscription_deliveries') as any)
        .select('subscriptions(monthly_total_amount, deliveries_per_month)')
        .eq('status', 'shipped');
      allTimeSubRevenue = (shippedDeliveries || []).reduce((sum: number, d: any) => {
        const sub = d.subscriptions;
        if (!sub?.monthly_total_amount || !sub?.deliveries_per_month) return sum;
        return sum + Math.floor(sub.monthly_total_amount / sub.deliveries_per_month);
      }, 0);

      // 来月予測（アクティブサブスクのmonthly_total_amount合計）
      const { data: activeSubs } = await (supabase.from('subscriptions') as any)
        .select('monthly_total_amount')
        .eq('status', 'active');
      nextMonthSubscriptionForecast = (activeSubs || []).reduce(
        (sum: number, row: any) => sum + (row.monthly_total_amount || 0), 0
      );
    } catch (err) {
      console.error('Revenue stats error:', err);
    }

    const stats = {
      totalMenuItems: menuItems.length,
      totalStock: 0,
      totalNews: newsItems.length,
      totalContacts: contacts.length,
      pendingContacts: pendingContacts.length,
      pendingOrders: pendingOrders.length,
      lowStockItems: inactiveMenuItems,
      // サブスクリプション統計
      activeSubscriptions,
      upcomingDeliveries,
      // 売上統計
      todaySubscriptionRevenue,
      todayOneTimeRevenue,
      allTimeSubRevenue,
      allTimeOneTimeRevenue,
      nextMonthSubscriptionForecast,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}