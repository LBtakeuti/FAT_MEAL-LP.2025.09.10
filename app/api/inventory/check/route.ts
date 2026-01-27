import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerClient();

    // セット在庫を取得
    const { data, error } = await (supabase
      .from('inventory_settings') as any)
      .select('stock_sets, items_per_set')
      .eq('set_type', '6-set')
      .single();

    if (error) {
      // レコードが存在しない場合は在庫なしとして処理
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          available: false,
          stockSets: 0,
          totalMeals: 0,
          sets: {
            'plan-6': false,
            'plan-12': false,
            'plan-18': false,
          },
          maxQuantity: {
            'plan-6': 0,
            'plan-12': 0,
            'plan-18': 0,
          },
        });
      }
      console.error('Inventory check error:', error);
      return NextResponse.json(
        { message: 'サーバーエラーが発生しました' },
        { status: 500 }
      );
    }

    const stockSets = data?.stock_sets || 0;
    const itemsPerSet = data?.items_per_set || 6;
    const totalMeals = stockSets * itemsPerSet;

    // 販売可能なセット数を計算
    // 6食セット = 1セット必要
    // 12食セット = 2セット必要
    // 18食セット = 3セット必要
    const availability = {
      available: stockSets > 0,
      stockSets,
      totalMeals,
      sets: {
        'plan-6': stockSets >= 1,
        'plan-12': stockSets >= 2,
        'plan-18': stockSets >= 3,
      },
      maxQuantity: {
        'plan-6': stockSets,
        'plan-12': Math.floor(stockSets / 2),
        'plan-18': Math.floor(stockSets / 3),
      },
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
