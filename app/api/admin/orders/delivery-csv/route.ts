import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_detail: string;
  building: string;
  menu_set: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const dateParam = searchParams.get('date');

    let query = (supabase.from('orders') as any)
      .select('id, customer_name, phone, postal_code, prefecture, city, address_detail, building, menu_set, created_at')
      .not('stripe_session_id', 'like', 'sub_delivery_%')
      .order('order_number', { ascending: true });

    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      query = query.in('id', ids);
    } else if (dateParam) {
      const startOfDayJST = new Date(`${dateParam}T00:00:00+09:00`).toISOString();
      const endOfDayJST = new Date(`${dateParam}T23:59:59+09:00`).toISOString();
      query = query.gte('created_at', startOfDayJST).lte('created_at', endOfDayJST);
    }

    const { data: orders, error } = await query as { data: Order[] | null; error: any };

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
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

    const rows = orders?.map((order) => [
      '0',
      '1',
      formatNextDayJST(order.created_at),
      order.phone || '',
      (order.postal_code || '').replace(/-/g, ''),
      (order.prefecture || '') + (order.city || '') + (order.address_detail || ''),
      order.building || '',
      order.customer_name || '',
      '090-3221-6638',
      '3430827',
      '埼玉県越谷市川柳町２丁目４０１',
      'LandBridge株式会社',
      order.menu_set || '',
    ]) || [];

    const bom = '\uFEFF';
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n');

    const jstDate = getJSTDateString();

    return new NextResponse(bom + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders_delivery_${jstDate}.csv"`
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
  return `${jstDate.getUTCFullYear()}-${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`;
}
