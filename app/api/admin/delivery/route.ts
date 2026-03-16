import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export type DeliveryItem = {
  id: string;
  source: 'subscription' | 'order';
  date: string; // YYYY-MM-DD
  customer_name: string;
  customer_email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_detail: string;
  building: string;
  plan_name: string;
  menu_set: string;
  meals_per_delivery: number;
  quantity: number;
  status: string;
  subscription_id?: string;
  delivery_number?: number;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const statusFilter = searchParams.get('status');
    const sourceFilter = searchParams.get('source');

    const items: DeliveryItem[] = [];

    // subscription_deliveries の取得
    if (!sourceFilter || sourceFilter === 'subscription') {
      let subQuery = (supabase as any)
        .from('subscription_deliveries')
        .select(`
          id, scheduled_date, status, menu_set, meals_per_delivery, quantity,
          subscriptions(id, plan_name, shipping_address, deliveries_per_month)
        `)
        .order('scheduled_date', { ascending: true });

      if (from) subQuery = subQuery.gte('scheduled_date', from);
      if (to) subQuery = subQuery.lte('scheduled_date', to);
      if (statusFilter) subQuery = subQuery.eq('status', statusFilter);

      const { data: deliveries, error: subError } = await subQuery;

      if (subError) {
        console.error('Failed to fetch subscription_deliveries:', subError);
      } else if (deliveries) {
        // 各 subscription ごとの配送通し番号を計算するために shipped 済みカウントを取得
        const subIds = [...new Set(deliveries.map((d: any) => d.subscriptions?.id).filter(Boolean))];

        // shipped 済みカウントを取得（全 deliveries の中で scheduled_date < from の shipped 数）
        const shippedCountMap: Record<string, number> = {};
        if (subIds.length > 0) {
          const { data: shippedData } = await (supabase as any)
            .from('subscription_deliveries')
            .select('subscription_id, scheduled_date, status')
            .in('subscription_id', subIds)
            .eq('status', 'shipped');

          if (shippedData) {
            for (const d of shippedData) {
              shippedCountMap[d.subscription_id] = (shippedCountMap[d.subscription_id] || 0) + 1;
            }
          }
        }

        // 配送通し番号の計算: 期間内の各 delivery に対し、同じ subscription の
        // scheduled_date が小さいものから順に番号をつける
        // まず subscription ごとにグループ化してソート
        const subDeliveriesMap: Record<string, any[]> = {};
        for (const d of deliveries) {
          const subId = d.subscriptions?.id;
          if (!subId) continue;
          if (!subDeliveriesMap[subId]) subDeliveriesMap[subId] = [];
          subDeliveriesMap[subId].push(d);
        }

        // 期間内の各 delivery の番号を計算
        // "期間外でshipped済み" + "期間内で自分より前のもの" + 1
        const deliveryNumberMap: Record<string, number> = {};
        for (const [subId, subDeliveries] of Object.entries(subDeliveriesMap)) {
          const sorted = subDeliveries.slice().sort((a: any, b: any) =>
            a.scheduled_date.localeCompare(b.scheduled_date)
          );
          // 期間外の shipped 済み数（期間内は除外）
          const outsideShipped = shippedCountMap[subId] || 0;
          // 期間内で shipped 済みの数は別途カウント
          // 期間外 shipped = outsideShipped - 期間内 shipped
          const insideShipped = sorted.filter((d: any) => d.status === 'shipped').length;
          const baseCount = outsideShipped - insideShipped;

          sorted.forEach((d: any, idx: number) => {
            deliveryNumberMap[d.id] = baseCount + idx + 1;
          });
        }

        for (const d of deliveries) {
          const sub = d.subscriptions;
          const addr = sub?.shipping_address || {};
          items.push({
            id: d.id,
            source: 'subscription',
            date: d.scheduled_date,
            customer_name: addr.name || '',
            customer_email: addr.email || '',
            phone: addr.phone || '',
            postal_code: addr.postal_code || '',
            prefecture: addr.prefecture || '',
            city: addr.city || '',
            address_detail: addr.address_detail || '',
            building: addr.building || '',
            plan_name: sub?.plan_name || '',
            menu_set: d.menu_set || sub?.plan_name || '',
            meals_per_delivery: d.meals_per_delivery || 12,
            quantity: d.meals_per_delivery || 12,
            status: d.status,
            subscription_id: sub?.id,
            delivery_number: deliveryNumberMap[d.id],
          });
        }
      }
    }

    // orders の取得
    if (!sourceFilter || sourceFilter === 'order') {
      let orderQuery = (supabase as any)
        .from('orders')
        .select(`
          id, created_at, status, menu_set, quantity, customer_name, customer_email,
          phone, postal_code, prefecture, city, address_detail, address, building, order_number
        `)
        .not('stripe_session_id', 'like', 'sub_delivery_%')
        .order('created_at', { ascending: true });

      if (from) orderQuery = orderQuery.gte('created_at', `${from}T00:00:00+09:00`);
      if (to) orderQuery = orderQuery.lte('created_at', `${to}T23:59:59+09:00`);
      if (statusFilter) orderQuery = orderQuery.eq('status', statusFilter);

      const { data: orders, error: orderError } = await orderQuery;

      if (orderError) {
        console.error('Failed to fetch orders:', orderError);
      } else if (orders) {
        for (const o of orders) {
          const dateStr = o.created_at ? o.created_at.slice(0, 10) : '';
          items.push({
            id: o.id,
            source: 'order',
            date: dateStr,
            customer_name: o.customer_name || '',
            customer_email: o.customer_email || '',
            phone: o.phone || '',
            postal_code: o.postal_code || '',
            prefecture: o.prefecture || '',
            city: o.city || '',
            address_detail: o.address_detail || o.address || '',
            building: o.building || '',
            plan_name: o.menu_set || '',
            menu_set: o.menu_set || '',
            meals_per_delivery: o.quantity || 6,
            quantity: o.quantity || 6,
            status: o.status,
          });
        }
      }
    }

    // date 昇順でソート
    items.sort((a, b) => a.date.localeCompare(b.date));

    // 期限切れ未発送カウント（date <= today かつ status != 'shipped'）
    const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const overdueCount = items.filter(
      (item) => item.date <= todayJST && item.status !== 'shipped'
    ).length;

    return NextResponse.json({ items, overdueCount });
  } catch (error) {
    console.error('Delivery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
