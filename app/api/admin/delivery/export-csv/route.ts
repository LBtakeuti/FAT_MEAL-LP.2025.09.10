import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const subIdsParam = searchParams.get('sub_ids');
    const orderIdsParam = searchParams.get('order_ids');

    const subIds = subIdsParam ? subIdsParam.split(',').filter(Boolean) : [];
    const orderIds = orderIdsParam ? orderIdsParam.split(',').filter(Boolean) : [];

    const rows: string[][] = [];

    // subscription_deliveries の取得
    if (subIds.length > 0) {
      const { data: deliveries, error } = await (supabase as any)
        .from('subscription_deliveries')
        .select(`
          id, scheduled_date, status, meals_per_delivery,
          subscriptions(id, plan_name, shipping_address)
        `)
        .in('id', subIds);

      if (error) {
        console.error('Failed to fetch subscription_deliveries:', error);
      } else if (deliveries) {
        // 各 subscription の全配送履歴を取得して配送番号を算出
        const subscriptionIds = [...new Set(deliveries.map((d: any) => d.subscriptions?.id).filter(Boolean))];
        // subscription_id -> [{scheduled_date, status}] のマップ
        const allDeliveriesMap: Record<string, Array<{ scheduled_date: string; status: string }>> = {};

        if (subscriptionIds.length > 0) {
          const { data: allData } = await (supabase as any)
            .from('subscription_deliveries')
            .select('subscription_id, scheduled_date, status')
            .in('subscription_id', subscriptionIds);

          if (allData) {
            for (const d of allData) {
              if (!allDeliveriesMap[d.subscription_id]) allDeliveriesMap[d.subscription_id] = [];
              allDeliveriesMap[d.subscription_id].push({ scheduled_date: d.scheduled_date, status: d.status });
            }
          }
        }

        for (const d of deliveries) {
          const sub = d.subscriptions;
          const addr = sub?.shipping_address || {};
          // 自分より前の日付に shipped 済みの件数 = 自分の配送番号 - 1
          const prevShipped = (allDeliveriesMap[sub?.id] || []).filter(
            (x) => x.scheduled_date < d.scheduled_date && x.status === 'shipped'
          ).length;
          const deliveryNumber = prevShipped + 1;
          const itemName = `${sub?.plan_name || ''}（${d.meals_per_delivery || 12}個）${deliveryNumber}回目`;

          rows.push([
            '0',
            '1',
            formatDateJST(d.scheduled_date),
            addr.phone || '',
            (addr.postal_code || '').replace(/-/g, ''),
            (addr.prefecture || '') + (addr.city || '') + (addr.address_detail || ''),
            addr.building || '',
            addr.name || '',
            process.env.SENDER_PHONE || '',
            process.env.SENDER_POSTAL_CODE || '',
            process.env.SENDER_ADDRESS || '',
            process.env.SENDER_COMPANY || '',
            itemName,
          ]);
        }
      }
    }

    // orders の取得
    if (orderIds.length > 0) {
      const { data: orders, error } = await (supabase as any)
        .from('orders')
        .select('id, customer_name, phone, postal_code, prefecture, city, address_detail, building, menu_set, quantity, created_at')
        .in('id', orderIds);

      if (error) {
        console.error('Failed to fetch orders:', error);
      } else if (orders) {
        for (const o of orders) {
          const itemName = `${o.menu_set || ''}（${o.quantity || 6}個）`;
          rows.push([
            '0',
            '1',
            formatNextDayJST(o.created_at),
            o.phone || '',
            (o.postal_code || '').replace(/-/g, ''),
            (o.prefecture || '') + (o.city || '') + (o.address_detail || ''),
            o.building || '',
            o.customer_name || '',
            process.env.SENDER_PHONE || '',
            process.env.SENDER_POSTAL_CODE || '',
            process.env.SENDER_ADDRESS || '',
            process.env.SENDER_COMPANY || '',
            itemName,
          ]);
        }
      }
    }

    const headers = [
      '送り状番号',
      'クール冷凍',
      '出荷予定日',
      'お届け先電話番号',
      'お届け先郵便番号',
      'お届け先住所',
      'お届け先アパートマンション名',
      'お届け先名',
      'ご依頼主電話番号',
      'ご依頼主郵便番号',
      'ご依頼主住所',
      'ご依頼主名',
      '品名１',
    ];

    const bom = '\uFEFF';
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n');

    const jstDate = getJSTDateString();

    return new NextResponse(bom + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="delivery_${jstDate}.csv"`
      }
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}

function formatDateJST(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(date.getTime() + jstOffset);
  return `${jstDate.getUTCFullYear()}/${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}/${String(jstDate.getUTCDate()).padStart(2, '0')}`;
}

function formatNextDayJST(dateStr: string): string {
  const date = new Date(dateStr);
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  jst.setDate(jst.getDate() + 1);
  return `${jst.getUTCFullYear()}/${String(jst.getUTCMonth() + 1).padStart(2, '0')}/${String(jst.getUTCDate()).padStart(2, '0')}`;
}

function escapeCSV(value: string): string {
  if (!value) return '""';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

function getJSTDateString(): string {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffset);
  return `${jstDate.getUTCFullYear()}${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}${String(jstDate.getUTCDate()).padStart(2, '0')}`;
}
