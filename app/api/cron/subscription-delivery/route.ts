import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const maxDuration = 60; // Vercelの最大実行時間

interface SubscriptionDelivery {
  id: string;
  subscription_id: string;
  delivery_number: number;
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
    total_deliveries: number;
    completed_deliveries: number;
  };
}

export async function GET(request: NextRequest) {
  // Cronジョブの認証（セキュリティのため）
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  console.log('[Subscription Delivery Cron] Starting...');
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Subscription Delivery Cron] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    
    console.log('[Subscription Delivery Cron] Processing deliveries for:', todayStr);
    
    // 今日配送予定の配送を取得
    const { data: todayDeliveries, error: fetchError } = await supabase
      .from('subscription_deliveries')
      .select(`
        *,
        subscriptions (
          id,
          plan_name,
          shipping_address,
          status,
          total_deliveries,
          completed_deliveries
        )
      `)
      .eq('scheduled_date', todayStr)
      .eq('status', 'pending') as { data: SubscriptionDelivery[] | null; error: any };

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
        
        // 配送予定を更新
        await supabase
          .from('subscription_deliveries')
          .update({
            status: 'shipped',
            delivered_date: todayStr,
            order_id: order.id,
            order_number: order.order_number,
            updated_at: new Date().toISOString(),
          })
          .eq('id', delivery.id);

        // サブスクリプションの配送回数を更新
        const newCompletedDeliveries = delivery.delivery_number;
        const updateData: any = {
          completed_deliveries: newCompletedDeliveries,
          updated_at: new Date().toISOString(),
        };
        
        // 次回配送番号を更新（最終回でない場合）
        if (newCompletedDeliveries < subscription.total_deliveries) {
          updateData.next_delivery_number = newCompletedDeliveries + 1;
        } else {
          updateData.next_delivery_number = null; // 最終回完了
        }
        
        await supabase
          .from('subscriptions')
          .update(updateData)
          .eq('id', subscription.id);

        // 最終回配送完了の場合、契約終了処理
        if (newCompletedDeliveries === subscription.total_deliveries) {
          await completeSubscription(subscription.id, supabase);
        }

        results.processed++;
        console.log(`[Subscription Delivery Cron] Successfully processed delivery ${delivery.id} (${delivery.delivery_number}/${subscription.total_deliveries})`);

      } catch (error) {
        console.error(`[Subscription Delivery Cron] Failed to process delivery ${delivery.id}:`, error);
        results.failed++;
      }
    }

    console.log('[Subscription Delivery Cron] Completed:', results);

    return NextResponse.json({
      success: true,
      date: todayStr,
      results,
    });
  } catch (error) {
    console.error('[Subscription Delivery Cron] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process subscription deliveries', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// 在庫確認関数
async function checkInventoryForDelivery(
  delivery: SubscriptionDelivery,
  supabase: ReturnType<typeof createServerClient>
): Promise<boolean> {
  try {
    // 全てのメニューアイテムの在庫を取得
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('id, stock, is_active')
      .eq('is_active', true);

    if (error || !menuItems || menuItems.length === 0) {
      console.error('[Subscription Delivery Cron] Failed to fetch menu items:', error);
      return false;
    }

    // 必要な在庫数を計算
    // 12食セット: 各弁当1個ずつ必要
    // 15食セット: 各弁当1個ずつ必要（ただし15食分）
    const requiredStock = delivery.meals_per_delivery === 12 ? 1 : 1; // 簡易版: 各弁当1個
    
    // 最小在庫を確認
    const minStock = Math.min(...menuItems.map((item: any) => item.stock || 0));
    
    return minStock >= requiredStock;
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
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_name: shippingAddress.name || 'お客様',
      customer_email: shippingAddress.email || '',
      phone: shippingAddress.phone || '',
      address: addressString,
      menu_set: delivery.menu_set,
      quantity: delivery.quantity,
      status: 'confirmed', // 配送確定
    })
    .select()
    .single();

  if (error || !order) {
    throw new Error(`Failed to create order: ${error?.message || 'Unknown error'}`);
  }

  // 在庫を減らす
  await reduceInventoryForDelivery(delivery, supabase);

  return {
    id: order.id,
    order_number: order.order_number,
  };
}

// 在庫を減らす関数
async function reduceInventoryForDelivery(
  delivery: SubscriptionDelivery,
  supabase: ReturnType<typeof createServerClient>
) {
  try {
    // 全てのメニューアイテムの在庫を取得
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('id, stock')
      .eq('is_active', true);

    if (error || !menuItems) {
      console.error('[Subscription Delivery Cron] Failed to fetch menu items for inventory reduction:', error);
      return;
    }

    // 各メニューアイテムの在庫を1つ減らす（簡易版）
    // 実際の実装では、配送内容に応じて適切な数量を減らす
    for (const item of menuItems) {
      const newStock = Math.max(0, (item.stock || 0) - 1);
      await supabase
        .from('menu_items')
        .update({ stock: newStock })
        .eq('id', item.id);
    }
  } catch (error) {
    console.error('[Subscription Delivery Cron] Error reducing inventory:', error);
  }
}

// 契約終了処理
async function completeSubscription(
  subscriptionId: string,
  supabase: ReturnType<typeof createServerClient>
) {
  try {
    // サブスクリプションを完了状態に更新
    await supabase
      .from('subscriptions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        next_delivery_number: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    console.log(`[Subscription Delivery Cron] Subscription ${subscriptionId} completed`);

    // 契約終了メール送信
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('shipping_address')
      .eq('id', subscriptionId)
      .single();

    if (subscription && subscription.shipping_address?.email) {
      await sendSubscriptionCompletionEmail({
        email: subscription.shipping_address.email,
        name: subscription.shipping_address.name || 'お客様',
      });
    }
  } catch (error) {
    console.error('[Subscription Delivery Cron] Error completing subscription:', error);
  }
}

// 契約終了メール送信
async function sendSubscriptionCompletionEmail(params: { email: string; name: string }) {
  try {
    const { Resend } = await import('resend');
    if (!process.env.RESEND_API_KEY) {
      console.log('[Subscription Delivery Cron] RESEND_API_KEY is not set, skipping email');
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'ふとるめし <noreply@futorumeshi.com>';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #fff; padding: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${params.name}様</p>
      <p>ふとるめし3ヶ月定期購入プランの全配送が完了しました。</p>
      <p>ご利用ありがとうございました。</p>
      <p>またのご利用をお待ちしております。</p>
    </div>
  </div>
</body>
</html>
    `;

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: params.email,
      subject: '【ふとるめし】定期購入が完了しました',
      html: emailHtml,
    });

    if (error) {
      console.error('[Subscription Delivery Cron] Failed to send completion email:', error);
    } else {
      console.log('[Subscription Delivery Cron] Completion email sent to:', params.email);
    }
  } catch (error) {
    console.error('[Subscription Delivery Cron] Error sending completion email:', error);
  }
}
