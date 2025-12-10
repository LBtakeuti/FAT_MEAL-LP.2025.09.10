import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Order型を定義
interface Order {
  order_number: string;
  customer_name: string;
  address: string;
  menu_set: string;
  quantity: number;
  phone: string;
  email: string;
  status: string;
  created_at: string;
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
      '注文者ID',
      '氏名',
      '住所',
      'セット',
      '数',
      '電話番号',
      'メールアドレス',
      'ステータス',
      '注文日時'
    ];

    // CSVデータ行
    const rows = orders?.map((order) => [
      order.order_number,
      order.customer_name,
      order.address,
      order.menu_set,
      order.quantity,
      order.phone,
      order.email,
      order.status,
      new Date(order.created_at).toLocaleString('ja-JP')
    ]) || [];

    // CSV形式に変換
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // BOM付きUTF-8でエンコード（Excelで正しく開けるようにするため）
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // レスポンスヘッダーを設定してCSVファイルとしてダウンロード
    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders_${new Date().toISOString().split('T')[0]}.csv"`
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
