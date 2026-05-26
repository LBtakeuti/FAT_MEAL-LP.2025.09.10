import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getPlanDisplayName } from '@/lib/plan-labels';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const subIdsParam = searchParams.get('sub_ids');
    const orderIdsParam = searchParams.get('order_ids');
    const tiktokIdsParam = searchParams.get('tiktok_ids');

    const subIds = subIdsParam ? subIdsParam.split(',').filter(Boolean) : [];
    const orderIds = orderIdsParam ? orderIdsParam.split(',').filter(Boolean) : [];
    const tiktokIds = tiktokIdsParam ? tiktokIdsParam.split(',').filter(Boolean) : [];

    const senderPhone = process.env.SENDER_PHONE || '090-3221-6638';
    const senderPostalCode = process.env.SENDER_POSTAL_CODE || '3430827';
    const senderAddress = process.env.SENDER_ADDRESS || '埼玉県越谷市川柳町２丁目４０１';
    const senderCompany = process.env.SENDER_COMPANY || 'LandBridge株式会社';

    const rows: string[][] = [];

    // subscription_deliveries の取得
    if (subIds.length > 0) {
      const { data: deliveries, error } = await (supabase as any)
        .from('subscription_deliveries')
        .select(`
          id, scheduled_date, preferred_delivery_date, status, meals_per_delivery,
          subscriptions(id, plan_id, plan_name, shipping_address)
        `)
        .in('id', subIds);

      if (error) {
        console.error('Failed to fetch subscription_deliveries:', error);
      } else if (deliveries) {
        for (const d of deliveries) {
          const sub = d.subscriptions;
          const addr = sub?.shipping_address || {};
          // F1: preferred_delivery_date 優先、NULL なら scheduled_date
          const displayDate = d.preferred_delivery_date ?? d.scheduled_date;
          // F11: plan_id から表示名を引く（「N回目」「（X個）」は付けない）
          const itemName = getPlanDisplayName(sub?.plan_id, sub?.plan_name || '');

          rows.push([
            '0',
            '1',
            formatDateJST(displayDate),
            addr.phone || '',
            (addr.postal_code || '').replace(/-/g, ''),
            (addr.prefecture || '') + (addr.city || '') + (addr.address_detail || ''),
            addr.building || '',
            addr.name || '',
            senderPhone,
            senderPostalCode,
            senderAddress,
            senderCompany,
            itemName,
          ]);
        }
      }
    }

    // orders の取得
    if (orderIds.length > 0) {
      const { data: orders, error } = await (supabase as any)
        .from('orders')
        .select('id, customer_name, phone, postal_code, prefecture, city, address_detail, building, menu_set, quantity, created_at, preferred_delivery_date')
        .in('id', orderIds);

      if (error) {
        console.error('Failed to fetch orders:', error);
      } else if (orders) {
        for (const o of orders) {
          // F11: orders は現役の単発購入 = trial-6（お試し6食セット）として表示統一
          const itemName = getPlanDisplayName('trial-6');
          // F1: preferred_delivery_date があれば優先、NULL なら従来の created_at+1日（出荷日）
          const shipDate = o.preferred_delivery_date
            ? formatDateJST(o.preferred_delivery_date)
            : formatNextDayJST(o.created_at);
          rows.push([
            '0',
            '1',
            shipDate,
            o.phone || '',
            (o.postal_code || '').replace(/-/g, ''),
            (o.prefecture || '') + (o.city || '') + (o.address_detail || ''),
            o.building || '',
            o.customer_name || '',
            senderPhone,
            senderPostalCode,
            senderAddress,
            senderCompany,
            itemName,
          ]);
        }
      }
    }

    // tiktok_shop_orders の取得
    if (tiktokIds.length > 0) {
      const { data: tikTokOrders, error } = await (supabase as any)
        .from('tiktok_shop_orders')
        .select('*')
        .in('id', tiktokIds);

      if (error) {
        console.error('Failed to fetch tiktok_shop_orders:', error);
      } else if (tikTokOrders) {
        for (const t of tikTokOrders) {
          const name = t.recipient || [t.last_name, t.first_name].filter(Boolean).join(' ');
          const phoneDigits = (t.phone || '').replace(/[^0-9+]/g, '');
          const phone = phoneDigits.startsWith('+81') ? '0' + phoneDigits.slice(3) : phoneDigits;
          const addr = [t.prefecture, t.county, t.city_ward, t.address_line_1]
            .filter(Boolean)
            .join('');
          // F11: TikTok 商品名は外部由来のため統一対象外、数量表記のみ削除
          const itemName = t.product_name || t.seller_sku || 'TikTok注文';
          rows.push([
            '0',
            '1',
            formatNextDayJST(t.created_time || new Date().toISOString()),
            phone,
            (t.zipcode || '').replace(/-/g, ''),
            addr,
            t.address_line_2 || '',
            name,
            senderPhone,
            senderPostalCode,
            senderAddress,
            senderCompany,
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
