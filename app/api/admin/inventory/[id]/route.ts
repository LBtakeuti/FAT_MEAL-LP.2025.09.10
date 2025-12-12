import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { stock } = await request.json();

    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { message: '在庫数は0以上の数値である必要があります' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 在庫数のみ更新
    const { data, error } = await (supabase
      .from('menu_items') as any)
      .update({ stock, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Stock update error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'アイテムが見つかりません' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'サーバーエラーが発生しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Stock update error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
