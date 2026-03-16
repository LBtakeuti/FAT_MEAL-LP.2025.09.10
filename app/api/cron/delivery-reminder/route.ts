import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const maxDuration = 60;

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayJST = nowJST.toISOString().slice(0, 10);

  // 前日10:00 JST（買い切り注文の取得開始点）
  const yesterdayAt10 = new Date(nowJST);
  yesterdayAt10.setDate(yesterdayAt10.getDate() - 1);
  const yesterdayJST = yesterdayAt10.toISOString().slice(0, 10);

  // サブスク配送（当日 + pending）
  const { data: subDeliveries } = await (supabase as any)
    .from('subscription_deliveries')
    .select(`
      id, scheduled_date, meals_per_delivery,
      subscriptions(plan_name, shipping_address)
    `)
    .eq('scheduled_date', todayJST)
    .eq('status', 'pending');

  // 買い切り注文（前日10:00〜当日09:59 JST + 未発送 + サブスク由来を除外）
  // ※ cronは毎日10:00 JSTに実行されるため、前回実行以降の注文を漏れなく取得する
  const { data: orders } = await (supabase as any)
    .from('orders')
    .select('id, customer_name, menu_set, quantity, prefecture, city, address_detail')
    .not('stripe_session_id', 'like', 'sub_delivery_%')
    .gte('created_at', `${yesterdayJST}T10:00:00+09:00`)
    .lte('created_at', `${todayJST}T09:59:59+09:00`)
    .in('status', ['pending', 'confirmed']);

  const subCount = subDeliveries?.length || 0;
  const orderCount = orders?.length || 0;
  const totalCount = subCount + orderCount;

  if (totalCount === 0) {
    return NextResponse.json({
      success: true,
      message: 'No deliveries today',
      date: todayJST,
      count: 0,
    });
  }

  const dateObj = new Date(`${todayJST}T00:00:00+09:00`);
  const weekday = WEEKDAYS[dateObj.getDay()];
  const dateLabel = `${todayJST.replace(/-/g, '/')}（${weekday}）`;

  await sendSlackReminder({ dateLabel, subDeliveries: subDeliveries || [], orders: orders || [], subCount, orderCount, totalCount });

  return NextResponse.json({
    success: true,
    date: todayJST,
    count: totalCount,
    subCount,
    orderCount,
  });
}

async function sendSlackReminder({
  dateLabel,
  subDeliveries,
  orders,
  subCount,
  orderCount,
  totalCount,
}: {
  dateLabel: string;
  subDeliveries: any[];
  orders: any[];
  subCount: number;
  orderCount: number;
  totalCount: number;
}) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const blocks: any[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🚚 本日の配送リマインダー' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${dateLabel}*\n📦 配送件数: 合計 *${totalCount}件*（サブスク: ${subCount}件 / 買い切り: ${orderCount}件）`,
      },
    },
    { type: 'divider' },
  ];

  if (subDeliveries.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📋 サブスク配送 (${subCount}件)*\n` +
          subDeliveries.map((d: any) => {
            const sub = d.subscriptions || {};
            const addr = sub.shipping_address || {};
            const address = [addr.prefecture, addr.city, addr.address_detail].filter(Boolean).join('');
            return `• *${addr.name || '(名前なし)'}* — ${sub.plan_name || ''}（${d.meals_per_delivery || 12}個）\n  ${address || '住所未設定'}`;
          }).join('\n'),
      },
    });
  }

  if (orders.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🛒 買い切り配送 (${orderCount}件)*\n` +
          orders.map((o: any) => {
            const address = [o.prefecture, o.city, o.address_detail].filter(Boolean).join('');
            return `• *${o.customer_name || '(名前なし)'}* — ${o.menu_set || ''}（${o.quantity || 6}個）\n  ${address || '住所未設定'}`;
          }).join('\n'),
      },
    });
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '⚠️ *配送管理画面でCSVを出力して業者に登録してください*',
    },
  });

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
    if (!res.ok) {
      console.error('[delivery-reminder] Slack webhook failed:', res.status);
    }
  } catch (err) {
    console.error('[delivery-reminder] Slack webhook error:', err);
  }
}
