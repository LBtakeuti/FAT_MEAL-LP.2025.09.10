import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// セット在庫を取得
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await (supabase
      .from('inventory_settings') as any)
      .select('id, set_type, stock_sets, items_per_set, updated_at')
      .eq('set_type', '6-set')
      .single();

    if (error) {
      // レコードが存在しない場合は初期値を返す
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          id: null,
          stockSets: 0,
          itemsPerSet: 6,
          updatedAt: null,
        });
      }
      console.error('Inventory fetch error:', error);
      return NextResponse.json(
        { message: 'サーバーエラーが発生しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id,
      stockSets: data.stock_sets,
      itemsPerSet: data.items_per_set,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

// セット在庫を更新
export async function PUT(request: NextRequest) {
  try {
    const { stockSets } = await request.json();

    if (typeof stockSets !== 'number' || stockSets < 0) {
      return NextResponse.json(
        { message: '在庫数は0以上の数値である必要があります' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 既存のレコードを確認
    const { data: existing } = await (supabase
      .from('inventory_settings') as any)
      .select('id')
      .eq('set_type', '6-set')
      .single();

    let result;

    if (existing) {
      // 更新
      const { data, error } = await (supabase
        .from('inventory_settings') as any)
        .update({
          stock_sets: stockSets,
          updated_at: new Date().toISOString(),
        })
        .eq('set_type', '6-set')
        .select()
        .single();

      if (error) {
        console.error('Stock update error:', error);
        return NextResponse.json(
          { message: 'サーバーエラーが発生しました' },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // 新規作成
      const { data, error } = await (supabase
        .from('inventory_settings') as any)
        .insert({
          set_type: '6-set',
          stock_sets: stockSets,
          items_per_set: 6,
        })
        .select()
        .single();

      if (error) {
        console.error('Stock insert error:', error);
        return NextResponse.json(
          { message: 'サーバーエラーが発生しました' },
          { status: 500 }
        );
      }
      result = data;
    }

    return NextResponse.json({
      id: result.id,
      stockSets: result.stock_sets,
      itemsPerSet: result.items_per_set,
      updatedAt: result.updated_at,
      message: '在庫を更新しました',
    });
  } catch (error) {
    console.error('Stock update error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
