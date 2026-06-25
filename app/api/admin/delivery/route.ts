import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withAuth, jsonSuccess, jsonBadRequest, jsonError } from '@/lib/api-helpers';
import { predictDeliveries } from '@/lib/delivery-prediction';
import { resolveDeliveryWorkDate } from '@/lib/business-days';
import { getMenuSetNameWithDeliveryNumber } from '@/lib/subscription-schedule';

// F4-4: クエリ範囲を「配送作業日」軸でフィルタするための JS 側拡張範囲。
//   resolveDeliveryWorkDate は土日祝で次の営業日にスライドするため、
//   created_at ベースの SQL クエリではターゲット日付の前後数日を含めて取得し、
//   後段で resolveDeliveryWorkDate(created_at) === target_date 等で絞り込む。
//   連続祝日最大4日 + 週末2日 + 余裕分でバッファを取る。
const WORK_DATE_BUFFER_DAYS = 7;

function shiftYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type DeliveryItem = {
  id: string;
  source: 'subscription' | 'order' | 'tiktok';
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
  tiktok_order_id?: string;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const statusFilter = searchParams.get('status');
    const sourceFilter = searchParams.get('source');
    const includePredictions = searchParams.get('include_predictions') === 'true';

    const items: DeliveryItem[] = [];

    // F4-4: from/to を「配送作業日」軸として解釈するため、SQL は created_at の前後拡張範囲で取得し
    //       後段で resolveDeliveryWorkDate(created_at) が target 範囲に含まれるものだけを残す。
    const workFromYmd = from ? shiftYmd(from, -WORK_DATE_BUFFER_DAYS) : null;
    const workToYmd = to ? shiftYmd(to, WORK_DATE_BUFFER_DAYS) : null;
    const inWorkDateRange = (workDate: string): boolean => {
      if (from && workDate < from) return false;
      if (to && workDate > to) return false;
      return true;
    };

    // subscription_deliveries の取得
    if (!sourceFilter || sourceFilter === 'subscription') {
      let subQuery = (supabase as any)
        .from('subscription_deliveries')
        .select(`
          id, created_at, scheduled_date, preferred_delivery_date, status, menu_set, meals_per_delivery, quantity,
          subscriptions(id, plan_name, shipping_address, deliveries_per_month)
        `)
        .order('created_at', { ascending: true });

      if (workFromYmd) subQuery = subQuery.gte('created_at', `${workFromYmd}T00:00:00+09:00`);
      if (workToYmd) subQuery = subQuery.lte('created_at', `${workToYmd}T23:59:59+09:00`);
      if (statusFilter) subQuery = subQuery.eq('status', statusFilter);

      const { data: rawDeliveries, error: subError } = await subQuery;
      // F4-4: created_at から算出した配送作業日が target 範囲に入るものだけ残す
      const deliveries = (rawDeliveries || []).filter((d: { created_at?: string }) =>
        !d.created_at || inWorkDateRange(resolveDeliveryWorkDate(new Date(d.created_at)))
      );

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
          // F1: preferred_delivery_date 優先、NULL なら scheduled_date
          items.push({
            id: d.id,
            source: 'subscription',
            date: d.preferred_delivery_date ?? d.scheduled_date,
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
          id, created_at, preferred_delivery_date, status, menu_set, quantity, customer_name, customer_email,
          phone, postal_code, prefecture, city, address_detail, address, building, order_number
        `)
        .not('stripe_session_id', 'like', 'sub_delivery_%')
        .order('created_at', { ascending: true });

      if (workFromYmd) orderQuery = orderQuery.gte('created_at', `${workFromYmd}T00:00:00+09:00`);
      if (workToYmd) orderQuery = orderQuery.lte('created_at', `${workToYmd}T23:59:59+09:00`);
      if (statusFilter) orderQuery = orderQuery.eq('status', statusFilter);

      const { data: rawOrders, error: orderError } = await orderQuery;
      // F4-4: created_at から算出した配送作業日が target 範囲に入るものだけ残す
      const orders = (rawOrders || []).filter((o: { created_at?: string }) =>
        !o.created_at || inWorkDateRange(resolveDeliveryWorkDate(new Date(o.created_at)))
      );

      if (orderError) {
        console.error('Failed to fetch orders:', orderError);
      } else if (orders) {
        for (const o of orders) {
          // F1: preferred_delivery_date 優先、NULL なら created_at の日付
          const dateStr = o.preferred_delivery_date ?? (o.created_at ? o.created_at.slice(0, 10) : '');
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

    // tiktok_shop_orders の取得
    if (!sourceFilter || sourceFilter === 'tiktok') {
      let tkQuery = (supabase as any)
        .from('tiktok_shop_orders')
        .select('*')
        .order('created_time', { ascending: true });

      if (workFromYmd) tkQuery = tkQuery.gte('created_time', `${workFromYmd}T00:00:00+09:00`);
      if (workToYmd) tkQuery = tkQuery.lte('created_time', `${workToYmd}T23:59:59+09:00`);
      if (statusFilter) tkQuery = tkQuery.eq('status', statusFilter);

      const { data: rawTikTokOrders, error: tkError } = await tkQuery;
      // F4-4: created_time から算出した配送作業日が target 範囲に入るものだけ残す
      const tikTokOrders = (rawTikTokOrders || []).filter((t: { created_time?: string }) =>
        !t.created_time || inWorkDateRange(resolveDeliveryWorkDate(new Date(String(t.created_time))))
      );
      if (tkError) {
        console.error('Failed to fetch tiktok_shop_orders:', tkError);
      } else if (tikTokOrders) {
        for (const t of tikTokOrders) {
          const dateStr = t.created_time ? (t.created_time as string).slice(0, 10) : '';
          const name = t.recipient || [t.last_name, t.first_name].filter(Boolean).join(' ');
          // TikTok の Phone は (+81)09012345678 のような形式のことがあるため数字化
          const phoneDigits = (t.phone || '').replace(/[^0-9+]/g, '');
          const phone = phoneDigits.startsWith('+81')
            ? '0' + phoneDigits.slice(3)
            : phoneDigits;
          const addrDetail = [t.county, t.city_ward, t.address_line_1].filter(Boolean).join('');
          items.push({
            id: t.id,
            source: 'tiktok',
            date: dateStr,
            customer_name: name,
            customer_email: '',
            phone,
            postal_code: t.zipcode || '',
            prefecture: t.prefecture || '',
            city: '',
            address_detail: addrDetail,
            building: t.address_line_2 || '',
            plan_name: t.product_name || t.seller_sku || 'TikTok注文',
            menu_set: t.product_name || t.seller_sku || 'TikTok注文',
            meals_per_delivery: t.quantity || 1,
            quantity: t.quantity || 1,
            status: t.status || 'pending',
            tiktok_order_id: t.tiktok_order_id,
          });
        }
      }
    }

    // 未来配送予測（オプション）
    if (includePredictions && from && to && (!sourceFilter || sourceFilter === 'subscription')) {
      try {
        const sb = supabase as any;
        const { data: activeSubs } = await sb
          .from('subscriptions')
          .select('id, stripe_subscription_id, plan_id, plan_name, current_period_end, shipping_address')
          .eq('status', 'active');

        // 既存の subscription_deliveries の日付を subscription_id ごとに集約
        const subIds = (activeSubs || []).map((s: { id: string }) => s.id);
        const existingByPid = new Map<string, Set<string>>();
        if (subIds.length > 0) {
          const { data: existingDeliveries } = await sb
            .from('subscription_deliveries')
            .select('subscription_id, scheduled_date')
            .in('subscription_id', subIds);
          for (const d of existingDeliveries || []) {
            const key = d.subscription_id as string;
            if (!existingByPid.has(key)) existingByPid.set(key, new Set());
            existingByPid.get(key)!.add(d.scheduled_date as string);
          }
        }

        const predicted = predictDeliveries(activeSubs || [], existingByPid, from, to);
        // 既存 items に追加（予測フラグを判別できるように id を prefix）
        for (const p of predicted) {
          items.push({
            id: `predicted:${p.subscription_id}:${p.date}`,
            source: 'subscription',
            date: p.date,
            customer_name: p.customer_name,
            customer_email: p.customer_email,
            phone: p.phone,
            postal_code: p.postal_code,
            prefecture: p.prefecture,
            city: p.city,
            address_detail: p.address_detail,
            building: p.building,
            plan_name: p.plan_name,
            menu_set: p.menu_set,
            meals_per_delivery: p.meals_per_delivery,
            quantity: p.quantity,
            status: 'predicted',
            subscription_id: p.subscription_id,
          });
        }
      } catch (e) {
        console.error('Prediction failed:', e);
      }
    }

    // date 昇順でソート
    items.sort((a, b) => a.date.localeCompare(b.date));

    // 期限切れ未発送カウント（date <= today かつ status != 'shipped'）
    const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const overdueCount = items.filter(
      (item) => item.date <= todayJST && item.status !== 'shipped'
    ).length;

    // 在庫健康度サマリ（今後30日の必要セット数 vs 物理在庫）
    let stockSummary: {
      currentSets: number;
      itemsPerSet: number;
      requiredSets30d: number;
      requiredMeals30d: number;
      level: 'ok' | 'warn' | 'danger';
    } | null = null;
    try {
      const sb = supabase as any;
      const { data: stockRow } = await sb
        .from('inventory_settings')
        .select('stock_sets, items_per_set')
        .eq('set_type', '6-set')
        .maybeSingle();
      const currentSets = stockRow?.stock_sets ?? 0;
      const itemsPerSet = stockRow?.items_per_set ?? 6;

      const horizon = new Date(Date.now() + 9 * 60 * 60 * 1000);
      horizon.setDate(horizon.getDate() + 30);
      const horizonStr = horizon.toISOString().slice(0, 10);

      // 今後30日の未発送 subscription_deliveries の必要食数
      const { data: future } = await sb
        .from('subscription_deliveries')
        .select('meals_per_delivery, quantity')
        .gte('scheduled_date', todayJST)
        .lte('scheduled_date', horizonStr)
        .neq('status', 'shipped');

      const requiredMeals30d = (future || []).reduce(
        (sum: number, d: { meals_per_delivery?: number; quantity?: number }) =>
          sum + (d.meals_per_delivery || 12) * (d.quantity || 1),
        0,
      );
      const requiredSets30d = Math.ceil(requiredMeals30d / itemsPerSet);

      let level: 'ok' | 'warn' | 'danger' = 'ok';
      if (currentSets < requiredSets30d) level = 'danger';
      else if (currentSets < requiredSets30d * 1.5) level = 'warn';

      stockSummary = { currentSets, itemsPerSet, requiredSets30d, requiredMeals30d, level };
    } catch (e) {
      console.error('Failed to compute stockSummary:', e);
    }

    return NextResponse.json({ items, overdueCount, stockSummary });
  } catch (error) {
    console.error('Delivery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: ステータス更新（source別にテーブルを分岐）
export const PATCH = withAuth(async (request: NextRequest) => {
  const body = await request.json();
  const { id, source, status } = body;

  if (!id || !source || !status) {
    return jsonBadRequest('id, source, status は必須です');
  }

  const allowedStatuses = ['pending', 'confirmed', 'shipped'];
  if (!allowedStatuses.includes(status)) {
    return jsonBadRequest('不正なステータスです');
  }

  const supabase = createServerClient() as any;
  const now = new Date().toISOString();

  if (source === 'subscription') {
    // 予測配送（仮想ID: predicted:${subscription_id}:${date}）は実レコードが無いため、
    // ステータス変更時に subscription_deliveries へ materialize（実レコード化）する。
    if (typeof id === 'string' && id.startsWith('predicted:')) {
      // id 形式: predicted:${subscription_id}:${date}
      // subscription_id は UUID、date は YYYY-MM-DD（いずれもコロンを含まない）。
      const parts = id.split(':');
      const subscriptionId = parts[1];
      const scheduledDate = parts[2];
      if (!subscriptionId || !scheduledDate) {
        return jsonBadRequest('不正な予測配送IDです');
      }

      // 既存行の有無を確認（DB 反映済み・他経路で実体化済みのケースに対応）
      const { data: existing, error: selectError } = await supabase
        .from('subscription_deliveries')
        .select('id')
        .eq('subscription_id', subscriptionId)
        .eq('scheduled_date', scheduledDate)
        .maybeSingle();
      if (selectError) {
        return jsonError('予測配送の確認に失敗しました', 500, selectError);
      }

      if (existing?.id) {
        // 既に実レコードがあれば通常どおり update
        const { error } = await supabase
          .from('subscription_deliveries')
          .update({ status, delivered_date: status === 'shipped' ? now : null })
          .eq('id', existing.id);
        if (error) return jsonError('サブスク配送の更新に失敗しました', 500, error);
        return jsonSuccess({ message: 'ステータスを更新しました' });
      }

      // 実レコードが無ければ insert（materialize）。
      // menu_set / meals_per_delivery は subscription から再算出する。
      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('id, plan_id, meals_per_delivery, shipping_address')
        .eq('id', subscriptionId)
        .maybeSingle();
      if (subError) {
        return jsonError('対象サブスクの取得に失敗しました', 500, subError);
      }
      if (!sub) {
        return jsonBadRequest('対象のサブスクリプションが見つかりません');
      }

      const planId = sub.plan_id as string;
      const mealsPerDelivery = (sub.meals_per_delivery as number) || 12;
      const customerEmail = sub.shipping_address?.email || null;

      const { error: insertError } = await supabase
        .from('subscription_deliveries')
        .insert({
          subscription_id: subscriptionId,
          scheduled_date: scheduledDate,
          // F1: 予測は scheduled_date と同値で実体化
          preferred_delivery_date: scheduledDate,
          menu_set: getMenuSetNameWithDeliveryNumber(planId, 0),
          meals_per_delivery: mealsPerDelivery,
          quantity: 1,
          status,
          delivered_date: status === 'shipped' ? now : null,
          customer_email: customerEmail,
        });
      if (insertError) {
        return jsonError('予測配送の実レコード化に失敗しました', 500, insertError);
      }
      return jsonSuccess({ message: 'ステータスを更新しました' });
    }

    const { error } = await supabase
      .from('subscription_deliveries')
      .update({ status, delivered_date: status === 'shipped' ? now : null })
      .eq('id', id);
    if (error) return jsonError('サブスク配送の更新に失敗しました', 500, error);
  } else if (source === 'order') {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: now })
      .eq('id', id);
    if (error) return jsonError('注文の更新に失敗しました', 500, error);
  } else if (source === 'tiktok') {
    const { error } = await supabase
      .from('tiktok_shop_orders')
      .update({ status, updated_at: now })
      .eq('id', id);
    if (error) return jsonError('TikTok注文の更新に失敗しました', 500, error);
  } else {
    return jsonBadRequest('不正なsourceです');
  }

  return jsonSuccess({ message: 'ステータスを更新しました' });
});
