import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// GET: カートとカートアイテムを取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // RLSで保護されているため、認証チェックはSupabase側で行われる
    const supabase = createServerClient();

    // カートを取得（なければ作成）
    const cartResult = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    let cart: { id: string } | null = cartResult.data as { id: string } | null;
    const cartError = cartResult.error;

    if (cartError && cartError.code === 'PGRST116') {
      // カートが存在しない場合は作成を試みる
      const { data: newCart, error: createError } = await (supabase
        .from('carts') as any)
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (createError) {
        // 重複エラー（23505）の場合は、既存のカートを取得
        if (createError.code === '23505') {
          const { data: existingCart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();
          cart = existingCart as { id: string } | null;
        } else {
          throw createError;
        }
      } else {
        cart = newCart;
      }
    } else if (cartError) {
      throw cartError;
    }

    if (!cart) {
      throw new Error('カートの作成に失敗しました');
    }

    // カートアイテムを取得（imagesカラムが存在しない場合を考慮）
    const { data: cartItems, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        id,
        menu_item_id,
        quantity,
        menu_items (
          id,
          name,
          price
        )
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      throw itemsError;
    }

    // データを整形
    const items = (cartItems || []).map((item: any) => ({
      id: item.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      menu_item_name: item.menu_items?.name || '',
      price: item.menu_items?.price || 0,
      image: null, // imagesカラムがない場合のため
    }));

    return NextResponse.json({
      cartId: cart.id,
      items,
    });
  } catch (error) {
    console.error('Failed to fetch cart:', error);
    return NextResponse.json(
      { error: 'カートの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST: カートにアイテムを追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, menuItemId, quantity } = body;

    if (!userId || !menuItemId || !quantity) {
      return NextResponse.json(
        { error: 'ユーザーID、メニューアイテムID、数量が必要です' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // カートを取得（なければ作成）
    const cartResult2 = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .single();

    let cart: { id: string } | null = cartResult2.data as { id: string } | null;
    const cartError = cartResult2.error;

    if (cartError && cartError.code === 'PGRST116') {
      const { data: newCart, error: createError } = await (supabase
        .from('carts') as any)
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (createError) {
        // 重複エラー（23505）の場合は、既存のカートを取得
        if (createError.code === '23505') {
          const { data: existingCart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .single();
          cart = existingCart as { id: string } | null;
        } else {
          throw createError;
        }
      } else {
        cart = newCart;
      }
    } else if (cartError) {
      throw cartError;
    }

    if (!cart) {
      throw new Error('カートの作成に失敗しました');
    }

    // 既存のカートアイテムを確認
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('menu_item_id', menuItemId)
      .single() as { data: { id: string; quantity: number } | null };

    if (existingItem) {
      // 既に存在する場合は数量を更新
      const { error: updateError } = await (supabase
        .from('cart_items') as any)
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // 新規追加
      const { error: insertError } = await (supabase
        .from('cart_items') as any)
        .insert({
          cart_id: cart.id,
          menu_item_id: menuItemId,
          quantity,
        });

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add cart item:', error);
    return NextResponse.json(
      { error: 'カートへの追加に失敗しました' },
      { status: 500 }
    );
  }
}

// PATCH: カートアイテムの数量を更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cartItemId, quantity } = body;

    if (!userId || !cartItemId || quantity === undefined) {
      return NextResponse.json(
        { error: 'ユーザーID、カートアイテムID、数量が必要です' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      // 数量が0以下の場合は削除
      return DELETE(request);
    }

    const supabase = createServerClient();

    // カートアイテムを更新
    const { error } = await (supabase
      .from('cart_items') as any)
      .update({ quantity })
      .eq('id', cartItemId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update cart item:', error);
    return NextResponse.json(
      { error: 'カートアイテムの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: カートアイテムを削除
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, cartItemId } = body;

    if (!userId || !cartItemId) {
      return NextResponse.json(
        { error: 'ユーザーIDとカートアイテムIDが必要です' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete cart item:', error);
    return NextResponse.json(
      { error: 'カートアイテムの削除に失敗しました' },
      { status: 500 }
    );
  }
}

