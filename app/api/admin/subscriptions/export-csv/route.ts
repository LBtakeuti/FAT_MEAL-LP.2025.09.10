import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  plan_name: string;
  plan_id: string;
  meals_per_delivery: number;
  deliveries_per_month: number;
  monthly_product_price: number;
  monthly_shipping_fee: number;
  monthly_total_amount: number;
  next_delivery_date: string | null;
  preferred_delivery_date: string | null;
  shipping_address: {
    name?: string;
    email?: string;
    phone?: string;
    postal_code?: string;
    prefecture?: string;
    city?: string;
    address_detail?: string;
    building?: string;
  };
  status: string;
  payment_status: string;
  started_at: string;
  canceled_at: string | null;
  referral_code?: string;
}

export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('started_at', { ascending: false }) as { data: Subscription[] | null; error: any };

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      throw error;
    }

    // CSVヘッダー
    const headers = [
      'サブスクリプションID',
      'Stripe ID',
      'お客様名',
      'メールアドレス',
      '電話番号',
      '郵便番号',
      '都道府県',
      '市区町村',
      '番地',
      '建物名',
      'プラン名',
      '配送回数/月',
      '月額料金',
      '初回配送希望日',
      '契約日',
      '契約開始日',
      'ステータス',
      '支払いステータス',
      '解約日',
      '紹介コード'
    ];

    // CSVデータ行
    const rows = subscriptions?.map((sub) => {
      const addr = sub.shipping_address || {};
      return [
        sub.id,
        sub.stripe_subscription_id || '',
        addr.name || '',
        addr.email || '',
        addr.phone || '',
        addr.postal_code || '',
        addr.prefecture || '',
        addr.city || '',
        addr.address_detail || '',
        addr.building || '',
        sub.plan_name,
        getDeliveryFrequencyLabel(sub.deliveries_per_month),
        sub.monthly_total_amount || 0,
        formatDateJST(sub.preferred_delivery_date),
        formatDateJST(sub.next_delivery_date),
        formatDateTimeJST(sub.started_at),
        translateStatus(sub.status),
        translatePaymentStatus(sub.payment_status),
        formatDateTimeJST(sub.canceled_at),
        sub.referral_code || '',
      ];
    }) || [];

    // CSV形式に変換（BOM付きUTF-8）
    const bom = '\uFEFF';
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n');

    const csvWithBom = bom + csvContent;
    const jstDate = getJSTDateString();

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="subscriptions_${jstDate}.csv"`
      }
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string): string {
  if (!value) return '""';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function getDeliveryFrequencyLabel(deliveriesPerMonth: number): string {
  switch (deliveriesPerMonth) {
    case 1: return '月1回';
    case 2: return '月2回';
    case 4: return '月4回';
    default: return `月${deliveriesPerMonth}回`;
  }
}

function translateStatus(status: string): string {
  switch (status) {
    case 'active':
      return 'アクティブ';
    case 'paused':
      return '一時停止';
    case 'canceled':
      return '解約済み';
    case 'past_due':
      return '支払い遅延';
    default:
      return status;
  }
}

function translatePaymentStatus(status: string): string {
  switch (status) {
    case 'active':
      return '正常';
    case 'past_due':
      return '遅延';
    case 'canceled':
      return '解約';
    case 'unpaid':
      return '未払い';
    default:
      return status;
  }
}

function formatDateJST(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(date.getTime() + jstOffset);

  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

function formatDateTimeJST(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(date.getTime() + jstOffset);

  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');
  const hours = String(jstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(jstDate.getUTCSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

function getJSTDateString(): string {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffset);
  return `${jstDate.getUTCFullYear()}${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}${String(jstDate.getUTCDate()).padStart(2, '0')}`;
}
