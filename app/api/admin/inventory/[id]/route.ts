import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import Stripe from 'stripe';

// Stripe初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// セット商品とStripe Price IDの対応（本番環境）
const SET_PRICES = {
  'plan-6': {
    priceId: 'price_1SmAA1Kvr8fxkHMdPNXFisV5',
    requiredStock: 2,  // 6個セット: 各弁当2個必要
  },
  'plan-12': {
    priceId: 'price_1SmAA4Kvr8fxkHMdkNorkE7f',
    requiredStock: 4,  // 12個セット: 各弁当4個必要
  },
  'plan-18': {
    priceId: 'price_1SmAA6Kvr8fxkHMdcojdzZxX',
    requiredStock: 6,  // 18個セット: 各弁当6個必要
  },
};

// 全商品の最小在庫を取得してStripeの価格状態を更新
async function syncStripeInventory(supabase: any) {
  try {
    // 全ての有効なメニューアイテムの在庫を取得
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('stock')
      .eq('is_active', true);

    if (error || !menuItems || menuItems.length === 0) {
      console.error('Failed to fetch menu items for inventory sync:', error);
      return;
    }

    // 最小在庫を計算
    const minStock = Math.min(...menuItems.map((item: any) => item.stock));
    console.log(`Minimum stock across all items: ${minStock}`);

    // 各セットのStripe価格状態を更新
    for (const [planId, config] of Object.entries(SET_PRICES)) {
      const shouldBeActive = minStock >= config.requiredStock;

      try {
        // 現在の価格状態を取得
        const price = await stripe.prices.retrieve(config.priceId);

        if (price.active !== shouldBeActive) {
          // 価格の状態を更新
          await stripe.prices.update(config.priceId, {
            active: shouldBeActive,
          });
          console.log(`Updated Stripe price ${config.priceId} (${planId}): active=${shouldBeActive}`);
        }
      } catch (stripeError) {
        console.error(`Failed to update Stripe price ${config.priceId}:`, stripeError);
      }
    }
  } catch (error) {
    console.error('Error syncing Stripe inventory:', error);
  }
}

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

    // 在庫数を更新
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

    // Stripeの在庫状態を同期
    await syncStripeInventory(supabase);

    return NextResponse.json({
      ...data,
      message: '在庫を更新し、Stripeと同期しました',
    });
  } catch (error) {
    console.error('Stock update error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
