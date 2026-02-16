import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Order型を定義
interface Order {
  order_number: string;
  customer_name: string;
  customer_name_kana: string;
  customer_email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_detail: string;
  building: string;
  address: string;
  menu_set: string;
  quantity: number;
  amount: number;
  email?: string; // 後方互換性
  status: string;
  created_at: string;
  referral_code?: string;
}

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: orders, error } = await (supabase
      .from('orders') as any)
      .select('*')
      .order('order_number', { ascending: true }) as { data: Order[] | null; error: any };

    if (error) {
      console.error('Orders fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    // CSVヘッダー
    const headers = [
      '出荷予定日',
      '送り状種類',
      'お届け先名',
      'お届け先郵便番号',
      'お届け先住所',
      '注文番号',
      'フリガナ',
      'メールアドレス',
      '電話番号',
      '注文内容',
      '数量',
      '金額',
      'ステータス',
      '注文日時（日本時間）'
    ];

    // CSVデータ行
    const rows = orders?.map((order) => [
      formatDateJST(order.created_at),
      '0',
      order.customer_name || '',
      order.postal_code || '',
      order.address || '',
      order.order_number,
      order.customer_name_kana || '',
      order.customer_email || order.email || '',
      order.phone || '',
      formatMenuSet(order.menu_set),
      order.quantity,
      order.amount || 0,
      translateStatus(order.status),
      formatDateTimeJST(order.created_at)
    ]) || [];

    // CSV形式に変換（エスケープ処理付き）
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n');

    // BOM付きUTF-8でエンコード（Excelで正しく開けるようにするため）
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // JSTで日付フォーマット
    const jstDate = getJSTDateString();

    // レスポンスヘッダーを設定してCSVファイルとしてダウンロード
    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders_${jstDate}.csv"`
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// メニューセットを見やすくフォーマット（カンマ区切り → 改行区切り）
function formatMenuSet(menuSet: string): string {
  if (!menuSet) return '';
  return menuSet.split(',').map(item => item.trim()).join('\n');
}

// 日付のみJSTでフォーマット（出荷予定日用）
function formatDateJST(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(date.getTime() + jstOffset);

  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

// 日時をJSTでフォーマット
function formatDateTimeJST(dateString: string): string {
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

// ステータスを日本語に翻訳
function translateStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'order_received': '注文受付',
    'notified': '連絡済み',
    'shipped': '発送済み',
    // 旧ステータス（互換性のため）
    'pending': '注文受付',
    'confirmed': '連絡済み',
    'delivered': '発送済み',
    'cancelled': 'キャンセル'
  };
  return statusMap[status] || status;
}

// CSVエスケープ処理
function escapeCSV(value: string): string {
  if (!value) return '""';
  // カンマ、ダブルクォート、改行を含む場合はダブルクォートで囲む
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return `"${value}"`;
}

// JSTの日付文字列を取得
function getJSTDateString(): string {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000;
  const jstDate = new Date(now.getTime() + jstOffset);
  return `${jstDate.getUTCFullYear()}-${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`;
}
