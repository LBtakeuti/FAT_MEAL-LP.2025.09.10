import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { message: '購入アイテムが指定されていません' },
        { status: 400 }
      );
    }
    
    // 在庫確認と更新
    const results = [];
    const errors = [];
    
    for (const purchaseItem of items) {
      const { id, quantity } = purchaseItem;
      const menuItem = db.getMenuItem(id);
      
      if (!menuItem) {
        errors.push(`商品ID ${id} が見つかりません`);
        continue;
      }
      
      if (menuItem.stock < quantity) {
        errors.push(`${menuItem.name} の在庫が不足しています（在庫: ${menuItem.stock}個）`);
        continue;
      }
      
      // 在庫を減らす（負の数を渡して減算）
      const success = db.updateStock(id, -quantity);
      if (success) {
        results.push({
          id,
          name: menuItem.name,
          quantity,
          remainingStock: menuItem.stock - quantity
        });
      }
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          message: '購入処理に一部失敗しました',
          errors,
          results 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: '購入が完了しました',
      results
    });
  } catch (error) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}