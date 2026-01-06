import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // 有効なメニューアイテムの在庫を取得
    const { data, error } = await (supabase
      .from('menu_items') as any)
      .select('id, name, stock, is_active')
      .eq('is_active', true);

    if (error) {
      console.error('Inventory check error:', error);
      return NextResponse.json(
        { message: 'サーバーエラーが発生しました' },
        { status: 500 }
      );
    }

    // 最小在庫数を計算（全ての弁当の在庫の最小値）
    const stocks = (data || []).map((item: any) => item.stock || 0);
    const minStock = stocks.length > 0 ? Math.min(...stocks) : 0;

    // 販売可能なセット数を計算
    // 6個セット = 各弁当1個ずつ必要
    // 12個セット = 各弁当2個ずつ必要
    // 18個セット = 各弁当3個ずつ必要
    const availability = {
      available: minStock > 0,
      minStock,
      sets: {
        'plan-6': minStock >= 1,
        'plan-12': minStock >= 2,
        'plan-18': minStock >= 3,
      },
      maxQuantity: {
        'plan-6': Math.floor(minStock / 1),
        'plan-12': Math.floor(minStock / 2),
        'plan-18': Math.floor(minStock / 3),
      },
      items: (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        stock: item.stock || 0,
      })),
    };

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Inventory check error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
