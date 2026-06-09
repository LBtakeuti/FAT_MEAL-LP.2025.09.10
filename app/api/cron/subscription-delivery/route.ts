import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { postSlack } from '@/lib/slack';

export const maxDuration = 60; // Vercelの最大実行時間

interface SubscriptionDelivery {
  id: string;
  subscription_id: string;
  scheduled_date: string;
  menu_set: string;
  meals_per_delivery: number;
  quantity: number;
  status: string;
  subscriptions?: {
    id: string;
    plan_name: string;
    shipping_address: any;
    status: string;
  };
}

export async function GET(request: NextRequest) {
  // Cronジョブの認証（セキュリティのため）
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  console.log('[Subscription Delivery Cron] Starting...');
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Subscription Delivery Cron] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    
    console.log('[Subscription Delivery Cron] Processing deliveries for:', todayStr);
    
    // 今日以前の未処理配送を取得（過去の取り残し分も含む）
    // F38: order_id IS NULL を追加して、既に order 作成済みのレコードを除外。
    // cron リトライ/二重起動による同一顧客への二重出荷を防ぐ。
    const { data: todayDeliveries, error: fetchError } = await supabase
      .from('subscription_deliveries')
      .select(`
        *,
        subscriptions (
          id,
          plan_name,
          shipping_address,
          status
        )
      `)
      .lte('scheduled_date', todayStr)
      .eq('status', 'pending')
      .is('order_id', null) as { data: SubscriptionDelivery[] | null; error: any };

    if (fetchError) {
      console.error('[Subscription Delivery Cron] Failed to fetch deliveries:', fetchError);
      throw fetchError;
    }

    if (!todayDeliveries || todayDeliveries.length === 0) {
      console.log('[Subscription Delivery Cron] No deliveries scheduled for today');
      return NextResponse.json({ 
        success: true,
        message: 'No deliveries scheduled for today',
        date: todayStr,
        processed: 0
      });
    }

    console.log(`[Subscription Delivery Cron] Found ${todayDeliveries.length} deliveries scheduled for today`);

    const results = {
      processed: 0,
      failed: 0,
      outOfStock: 0,
    };

    // 各配送を処理
    for (const delivery of todayDeliveries) {
      const subscription = delivery.subscriptions;
      
      if (!subscription || subscription.status !== 'active') {
        console.log(`[Subscription Delivery Cron] Skipping delivery ${delivery.id}: subscription not active`);
        continue;
      }

      try {
        // 在庫確認
        const hasStock = await checkInventoryForDelivery(delivery, supabase);
        
        if (!hasStock) {
          console.log(`[Subscription Delivery Cron] Out of stock for delivery ${delivery.id}`);
          results.outOfStock++;
          continue;
        }

        // 注文を作成
        const order = await createOrderFromDelivery(delivery, subscription, supabase);
        
        // 配送予定を更新（ステータスは手動管理のため変更しない）
        await (supabase
          .from('subscription_deliveries') as any)
          .update({
            order_id: order.id,
            order_number: order.order_number,
            updated_at: new Date().toISOString(),
          })
          .eq('id', delivery.id);

        results.processed++;
        console.log(`[Subscription Delivery Cron] Successfully processed delivery ${delivery.id}`);

      } catch (error) {
        console.error(`[Subscription Delivery Cron] Failed to process delivery ${delivery.id}:`, error);
        results.failed++;
      }
    }

    console.log('[Subscription Delivery Cron] Completed:', results);

    // F47: failed が出ていれば運用 Slack に警告
    // F47-fix: Slack 失敗で cron 全体失敗 catch に落ちないよう .catch() を付ける
    if (results.failed > 0) {
      await postSlack('ops', [
        {
          type: 'header',
          text: { type: 'plain_text', text: '⚠️ サブスク配送cron: 一部失敗', emoji: true },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*対象日:* ${todayStr}\n*processed:* ${results.processed} / *failed:* ${results.failed} / *outOfStock:* ${results.outOfStock}`,
          },
        },
      ]).catch(() => { /* Slack側失敗は呼び出し元を止めない */ });
    }

    return NextResponse.json({
      success: true,
      date: todayStr,
      results,
    });
  } catch (error) {
    console.error('[Subscription Delivery Cron] Error:', error);
    // F47: cron 全体失敗時の Slack 通知
    await postSlack('ops', [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚨 サブスク配送cron: 全体失敗', emoji: true },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*エラー:* ${error instanceof Error ? error.message : String(error)}`,
        },
      },
    ]).catch(() => { /* Slack側失敗は呼び出し元を止めない */ });
    return NextResponse.json(
      {
        error: 'Failed to process subscription deliveries',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 在庫確認関数（inventory_settings.stock_setsで判定）
async function checkInventoryForDelivery(
  delivery: SubscriptionDelivery,
  supabase: ReturnType<typeof createServerClient>
): Promise<boolean> {
  try {
    // inventory_settingsからセット在庫を取得
    const { data: inventorySettings, error } = await (supabase
      .from('inventory_settings') as any)
      .select('stock_sets')
      .eq('set_type', '6-set')
      .single();

    if (error || !inventorySettings) {
      console.error('[Subscription Delivery Cron] Failed to fetch inventory settings:', error);
      return false;
    }

    // F38: 必要セット数は meals_per_delivery（1セット=6食）から動的計算。
    // 6食プラン → 1セット、12食プラン → 2セット、将来18食 → 3セット。
    // 旧実装は `requiredSets = 2` ハードコードのため、6食プランで在庫1セット時に
    // 配送可能なのに out-of-stock 扱いでスキップされていた。
    const mealsPerDelivery = delivery.meals_per_delivery || 12;
    const requiredSets = Math.ceil(mealsPerDelivery / 6);
    const currentStock = inventorySettings.stock_sets || 0;

    return currentStock >= requiredSets;
  } catch (error) {
    console.error('[Subscription Delivery Cron] Error checking inventory:', error);
    return false;
  }
}

// 注文を作成する関数
async function createOrderFromDelivery(
  delivery: SubscriptionDelivery,
  subscription: NonNullable<SubscriptionDelivery['subscriptions']>,
  supabase: ReturnType<typeof createServerClient>
): Promise<{ id: string; order_number: number }> {
  const shippingAddress = subscription.shipping_address || {};
  
  // 住所を構築
  const addressString = [
    shippingAddress.postal_code,
    shippingAddress.prefecture,
    shippingAddress.city,
    shippingAddress.address_detail,
    shippingAddress.building,
  ].filter(Boolean).join(' ');

  // ordersテーブルに注文を作成
  // F1: subscription_deliveries.scheduled_date を preferred_delivery_date として継承
  // （F3 でユーザー指定値があれば、delivery 側の preferred_delivery_date を流用するよう差し替え）
  const { data: order, error } = await (supabase
    .from('orders') as any)
    .insert({
      stripe_session_id: `sub_delivery_${delivery.id}`, // サブスク配送用の識別子
      customer_name: shippingAddress.name || 'お客様',
      customer_email: shippingAddress.email || '',
      phone: shippingAddress.phone || '',
      postal_code: shippingAddress.postal_code || '',
      prefecture: shippingAddress.prefecture || '',
      city: shippingAddress.city || '',
      address_detail: shippingAddress.address_detail || '',
      building: shippingAddress.building || '',
      address: addressString,
      menu_set: delivery.menu_set,
      quantity: delivery.quantity,
      amount: 0, // サブスクは別途Stripe決済済み
      status: 'pending', // 注文受付（管理画面で confirmed→shippedに変更）
      preferred_delivery_date: delivery.scheduled_date,
    })
    .select()
    .single();

  if (error || !order) {
    throw new Error(`Failed to create order: ${error?.message || 'Unknown error'}`);
  }

  // 在庫減算はWebhook（注文確定時）でまとめて行うため、Cronでは減算しない

  return {
    id: order.id,
    order_number: order.order_number,
  };
}

