import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withErrorHandler,
  jsonSuccess,
  jsonBadRequest,
  jsonError,
} from '@/lib/api-helpers';

interface PurchaseItem {
  id: string;
  quantity: number;
}

// POST: 購入処理
export const POST = withErrorHandler(async (request: NextRequest) => {
  const { items } = await request.json();

  if (!items || !Array.isArray(items)) {
    return jsonBadRequest('購入アイテムが指定されていません');
  }

  const supabase = createServerClient();
  const results: Array<{
    id: string;
    name: string;
    quantity: number;
    remainingStock: number;
  }> = [];
  const errors: string[] = [];

  for (const purchaseItem of items as PurchaseItem[]) {
    const { id, quantity } = purchaseItem;

    // メニューアイテムを取得
    const { data: menuItem, error: fetchError } = await supabase
      .from('menu_items')
      .select('id, name, stock')
      .eq('id', id)
      .single();

    if (fetchError || !menuItem) {
      errors.push(`商品ID ${id} が見つかりません`);
      continue;
    }

    if (menuItem.stock < quantity) {
      errors.push(
        `${menuItem.name} の在庫が不足しています（在庫: ${menuItem.stock}個）`
      );
      continue;
    }

    // 在庫を更新
    const newStock = menuItem.stock - quantity;
    const { error: updateError } = await (supabase.from('menu_items') as any)
      .update({ stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      errors.push(`${menuItem.name} の在庫更新に失敗しました`);
      continue;
    }

    results.push({
      id,
      name: menuItem.name,
      quantity,
      remainingStock: newStock,
    });
  }

  if (errors.length > 0) {
    return jsonError('購入処理に一部失敗しました', 400, {
      message: errors.join(', '),
    });
  }

  return jsonSuccess({
    message: '購入が完了しました',
    results,
  });
});
