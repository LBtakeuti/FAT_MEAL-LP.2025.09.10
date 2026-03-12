import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  meals_per_delivery: number;
  next_delivery_date: string | null;
  shipping_address: {
    name?: string;
    phone?: string;
    postal_code?: string;
    prefecture?: string;
    city?: string;
    address_detail?: string;
    building?: string;
  };
  subscription_deliveries: { status: string }[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    const dateParam = searchParams.get('date');

    let query = supabase
      .from('subscriptions')
      .select('id, plan_id, plan_name, meals_per_delivery, next_delivery_date, shipping_address, subscription_deliveries(status)')
      .order('started_at', { ascending: false });

    if (idsParam) {
      const ids = idsParam.split(',').filter(Boolean);
      query = (query as any).in('id', ids);
    } else if (dateParam) {
      const startOfDayJST = new Date(`${dateParam}T00:00:00+09:00`).toISOString();
      const endOfDayJST = new Date(`${dateParam}T23:59:59+09:00`).toISOString();
      query = (query as any).gte('started_at', startOfDayJST).lte('started_at', endOfDayJST);
    }

    const { data: subscriptions, error } = await query as { data: Subscription[] | null; error: any };

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
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

    const rows = subscriptions?.map((sub) => {
      const addr = sub.shipping_address || {};
      const completedCount = (sub.subscription_deliveries || []).filter(d => d.status === 'shipped').length;
      const deliveryNumber = completedCount + 1;
      return [
        '0',
        '1',
        formatDateJST(sub.next_delivery_date),
        addr.phone || '',
        (addr.postal_code || '').replace(/-/g, ''),
        (addr.prefecture || '') + (addr.city || '') + (addr.address_detail || ''),
        addr.building || '',
        addr.name || '',
        '090-3221-6638',
        '3430827',
        '埼玉県越谷市川柳町２丁目４０１',
        'LandBridge株式会社',
        getItemName(sub.plan_name, sub.meals_per_delivery, deliveryNumber),
      ];
    }) || [];

    const bom = '\uFEFF';
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n');

    const jstDate = getJSTDateString();

    return new NextResponse(bom + csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscriptions_delivery_${jstDate}.csv"`
      }
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}

function getItemName(planName: string, mealsPerDelivery: number, deliveryNumber: number): string {
  return `${planName}（${mealsPerDelivery}個）${deliveryNumber}回目`;
}

function formatDateJST(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(date.getTime() + jstOffset);
  return `${jstDate.getUTCFullYear()}/${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}/${String(jstDate.getUTCDate()).padStart(2, '0')}`;
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
