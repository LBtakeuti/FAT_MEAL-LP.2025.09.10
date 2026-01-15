import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

    const stats = {
      totalMenuItems: menuItems.length,
      totalStock: 0,
      totalNews: newsItems.length,
      totalContacts: contacts.length,
      pendingContacts: pendingContacts.length,
      pendingOrders: pendingOrders.length,
      lowStockItems: inactiveMenuItems,
      // サブスクリプション統計を追加
      activeSubscriptions,
      upcomingDeliveries,
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