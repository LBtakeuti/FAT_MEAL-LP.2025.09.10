import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import { 
  calculateInitialDeliverySchedule, 
  calculateMonthlyDeliverySchedule,
  getPlanConfig, 
  getPlanName, 
  getMenuSetName,
  isValidPlanId 
} from '@/lib/subscription-schedule';

// 遅延初期化（ビルド時にエラーを防ぐ）
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// セット商品から弁当数を計算
function calculateMealsFromDescription(description: string): number {
  const match = description.match(/(\d+)個セット/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const multiMatch = description.match(/(\d+)種類×(\d+)個/);
  if (multiMatch) {
    return parseInt(multiMatch[1], 10) * parseInt(multiMatch[2], 10);
  }
  // お試しプラン（6食セット）
  if (description.includes('6食')) {
    return 6;
  }
  return 1;
}

async function getResendClient() {
  const { Resend } = await import('resend');
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

// Supabaseクライアント（遅延初期化）
function getSupabaseClient() {
  try {
    return createServerClient();
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripeClient();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  console.log(`Processing webhook event: ${event.type}`);

  try {
    switch (event.type) {
      // 一回購入（お試しプラン）の決済完了
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // サブスクリプションの場合は customer.subscription.created で処理するのでスキップ
        if (session.mode === 'subscription') {
          console.log('Subscription checkout completed, waiting for subscription.created event');
          break;
        }
        
        // 一回購入の場合
        await handleSuccessfulPayment(session, stripe);
        break;
      }

      // サブスクリプション作成時
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await createSubscriptionFromStripe(subscription, stripe);
        break;
      }

      // サブスクリプション更新時（ステータス変更など）
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscriptionFromStripe(subscription);
        break;
      }

      // サブスクリプションの請求成功時（毎月の自動課金成功時）
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).subscription && invoice.billing_reason !== 'subscription_create') {
          await handleMonthlySubscriptionPayment(invoice, stripe);
        }
        break;
      }

      // サブスクリプションの請求失敗時
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if ((invoice as any).subscription) {
          await handlePaymentFailed(invoice);
        }
        break;
      }

      // サブスクリプション削除時（解約）
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await cancelSubscription(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling ${event.type}:`, error);
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// 一回購入（お試しプラン）の処理
async function handleSuccessfulPayment(session: Stripe.Checkout.Session, stripe: Stripe) {
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name || session.metadata?.customer_name;
  const customerPhone = session.customer_details?.phone || session.metadata?.phone;
  const amountTotal = session.amount_total;

  if (!customerEmail) {
    console.error('No customer email found in session');
    return;
  }

  // 注文詳細を取得
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  // 注文内容を文字列に変換
  const menuSet = lineItems.data
    .map(item => `${item.description} × ${item.quantity}`)
    .join(', ');

  // 住所を取得
  const addressString = session.metadata?.address || '';

  // 数量を計算
  const totalQuantity = lineItems.data.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // ユーザーIDを取得（emailから）
  let userId: string | null = null;
  const supabase = getSupabaseClient();
  if (supabase && customerEmail) {
    try {
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find(u => u.email === customerEmail);
      userId = user?.id || null;
    } catch {
      // ユーザーが見つからない場合はnullのまま
    }
  }

  // データベースに注文を保存
  if (supabase) {
    try {
      const { error: dbError } = await (supabase
        .from('orders') as any)
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string || null,
          customer_name: customerName || 'お客様',
          customer_email: customerEmail,
          phone: customerPhone || session.metadata?.phone || '',
          address: addressString,
          menu_set: menuSet,
          quantity: totalQuantity,
          amount: amountTotal || 0,
          currency: session.currency || 'jpy',
          status: 'pending',
        });

      if (dbError) {
        console.error('Failed to save order to database:', dbError);
      } else {
        console.log('Order saved to database successfully');
      }
    } catch (error) {
      console.error('Error saving order to database:', error);
    }
  }

  // メール送信
  await sendOrderConfirmationEmail({
    email: customerEmail,
    name: customerName || 'お客様',
    orderId: session.id,
    amount: amountTotal || 0,
    items: lineItems.data,
  });

  // Slack通知
  await sendSlackNotification({
    customerName: customerName || 'お客様',
    customerEmail: customerEmail,
    orderId: session.id,
    amount: amountTotal || 0,
    items: lineItems.data,
  });

  // 在庫を減らす
  await reduceInventory(lineItems.data);

  console.log('One-time order processed successfully');
}

// 在庫を減らす関数
async function reduceInventory(items: Stripe.LineItem[]) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available, inventory not reduced');
    return;
  }

  // 購入された商品から総弁当数を計算
  let totalMealsToReduce = 0;
  for (const item of items) {
    const description = item.description || '';
    const quantity = item.quantity || 1;
    const mealsPerItem = calculateMealsFromDescription(description);
    totalMealsToReduce += mealsPerItem * quantity;
  }

  if (totalMealsToReduce === 0) {
    console.log('No meals to reduce from inventory');
    return;
  }

  try {
    // 全ての有効なメニューアイテムを取得
    const { data: menuItems, error: fetchError } = await (supabase
      .from('menu_items') as any)
      .select('id, name, stock')
      .eq('is_active', true)
      .gt('stock', 0);

    if (fetchError) {
      console.error('Failed to fetch menu items:', fetchError);
      return;
    }

    if (!menuItems || menuItems.length === 0) {
      console.error('No active menu items found');
      return;
    }

    // 各メニューアイテムから均等に在庫を減らす
    const reductionPerItem = Math.ceil(totalMealsToReduce / menuItems.length);

    for (const menuItem of menuItems as any[]) {
      const newStock = Math.max(0, menuItem.stock - reductionPerItem);

      const { error: updateError } = await (supabase
        .from('menu_items') as any)
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', menuItem.id);

      if (updateError) {
        console.error(`Failed to update stock for ${menuItem.name}:`, updateError);
      } else {
        console.log(`Stock updated for ${menuItem.name}: ${menuItem.stock} -> ${newStock}`);
      }
    }
  } catch (error) {
    console.error('Error reducing inventory:', error);
  }
}

// サブスクリプション作成処理（Stripe customer.subscription.created）
async function createSubscriptionFromStripe(subscription: Stripe.Subscription, stripe: Stripe) {
  console.log(`[Webhook] createSubscriptionFromStripe called for subscription: ${subscription.id}`);
  
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('[Webhook] Supabase client not available');
    throw new Error('Supabase client not available');
  }

  try {
    // まずCheckout Sessionを取得してメタデータを取得
    console.log(`[Webhook] Fetching checkout session for subscription: ${subscription.id}`);
    const sessions = await stripe.checkout.sessions.list({
      subscription: subscription.id,
      limit: 1,
    });
    const checkoutSession = sessions.data[0] || null;
    console.log(`[Webhook] Checkout session found: ${checkoutSession?.id || 'none'}`);

    // plan_idをサブスクリプションメタデータまたはCheckout Sessionメタデータから取得
    const planId = subscription.metadata?.plan_id || 
                   checkoutSession?.metadata?.plan_id || '';
    
    console.log(`[Webhook] Plan ID: ${planId}`);
    
    if (!planId || !isValidPlanId(planId)) {
      console.error(`[Webhook] Invalid plan ID: ${planId}`);
      console.error(`[Webhook] subscription.metadata: ${JSON.stringify(subscription.metadata)}`);
      console.error(`[Webhook] checkoutSession.metadata: ${JSON.stringify(checkoutSession?.metadata)}`);
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    const customerEmail = checkoutSession?.customer_details?.email || 
                          checkoutSession?.customer_email ||
                          checkoutSession?.metadata?.email || '';
    const customerName = checkoutSession?.metadata?.customer_name || 'お客様';
    const preferredDeliveryDateStr = checkoutSession?.metadata?.preferred_delivery_date || 
                                     subscription.metadata?.preferred_delivery_date || '';
    
    console.log(`[Webhook] Customer: ${customerEmail}, ${customerName}`);

    // プラン設定を取得
    const planConfig = getPlanConfig(planId);
    const planName = getPlanName(planId);
    const menuSet = getMenuSetName(planId);

    // 配送スケジュールを計算
    const startDate = preferredDeliveryDateStr 
      ? new Date(preferredDeliveryDateStr)
      : new Date((subscription as any).current_period_start * 1000 + 7 * 24 * 60 * 60 * 1000); // 1週間後

    const deliverySchedules = calculateInitialDeliverySchedule(planId, startDate);

    // ユーザーIDを取得
    let userId: string | null = null;
    if (customerEmail) {
      try {
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users?.find(u => u.email === customerEmail);
        userId = user?.id || null;
        console.log(`[Webhook] User ID found: ${userId || 'none'}`);
      } catch (userError) {
        console.log(`[Webhook] Could not find user by email: ${customerEmail}`, userError);
        // ユーザーが見つからない場合はnullのまま
      }
    }

    console.log(`[Webhook] Creating subscription in database...`);
    // subscriptionsテーブルに作成
    const { data: dbSubscription, error: subError } = await (supabase
      .from('subscriptions') as any)
      .insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: subscription.items.data[0]?.price.id || '',
        plan_id: planId,
        plan_name: planName,
        quantity: 1,
        meals_per_delivery: planConfig.meals_per_delivery,
        deliveries_per_month: planConfig.deliveries_per_month,
        monthly_product_price: planConfig.product_price,
        monthly_shipping_fee: planConfig.shipping_fee_per_delivery * planConfig.deliveries_per_month,
        monthly_total_amount: planConfig.monthly_total,
        next_delivery_date: deliverySchedules[0]?.scheduled_date.toISOString().split('T')[0] || null,
        preferred_delivery_date: preferredDeliveryDateStr || null,
        shipping_address: {
          name: customerName,
          email: customerEmail,
          phone: checkoutSession?.metadata?.phone || subscription.metadata?.phone || '',
          postal_code: checkoutSession?.metadata?.postal_code || '',
          prefecture: checkoutSession?.metadata?.prefecture || '',
          city: checkoutSession?.metadata?.city || '',
          address_detail: checkoutSession?.metadata?.address_detail || '',
          building: checkoutSession?.metadata?.building || '',
        },
        status: 'active',
        payment_status: 'active',
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        started_at: new Date(subscription.created * 1000).toISOString(),
      })
      .select()
      .single();

    if (subError || !dbSubscription) {
      console.error('[Webhook] Failed to create subscription:', subError);
      throw new Error(`Failed to create subscription: ${subError?.message}`);
    }
    
    console.log(`[Webhook] Subscription created in DB: ${(dbSubscription as any).id}`);

    // subscription_deliveriesテーブルに初回配送予定を作成
    const deliveries = deliverySchedules.map((schedule) => ({
      subscription_id: (dbSubscription as any).id,
      scheduled_date: schedule.scheduled_date.toISOString().split('T')[0],
      menu_set: menuSet,
      meals_per_delivery: schedule.meals_per_delivery,
      quantity: 1,
      status: 'pending',
    }));

    const { error: deliveryError } = await (supabase
      .from('subscription_deliveries') as any)
      .insert(deliveries);

    if (deliveryError) {
      console.error('Failed to create delivery schedules:', deliveryError);
    }

    console.log(`Subscription created: ${(dbSubscription as any).id} with ${deliveries.length} initial deliveries`);

    // 購入完了メール送信
    await sendSubscriptionPurchaseConfirmationEmail({
      email: customerEmail,
      name: customerName,
      subscriptionId: (dbSubscription as any).id,
      planName: planName,
      monthlyAmount: planConfig.monthly_total,
      deliverySchedules: deliverySchedules,
    });

    // Slack通知
    await sendSubscriptionSlackNotification({
      customerName: customerName,
      customerEmail: customerEmail,
      planName: planName,
      monthlyAmount: planConfig.monthly_total,
    });

  } catch (error) {
    console.error('Error creating subscription from Stripe:', error);
    throw error;
  }
}

// 毎月の請求成功時の処理
async function handleMonthlySubscriptionPayment(invoice: Stripe.Invoice, stripe: Stripe) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available');
    return;
  }

  const stripeSubscriptionId = (invoice as any).subscription as string;
  if (!stripeSubscriptionId) {
    console.error('No subscription ID in invoice');
    return;
  }

  try {
    // サブスクリプションを取得
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const planId = subscription.metadata?.plan_id || '';

    if (!planId || !isValidPlanId(planId)) {
      console.error(`Invalid plan ID: ${planId}`);
      return;
    }

    // DBのサブスクリプションを取得
    const { data: dbSubscription, error: fetchError } = await (supabase
      .from('subscriptions') as any)
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single();

    if (fetchError || !dbSubscription) {
      console.error('Subscription not found in database:', fetchError);
      return;
    }

    // 月次配送スケジュールを計算
    const billingDate = new Date((subscription as any).current_period_start * 1000);
    const deliverySchedules = calculateMonthlyDeliverySchedule(planId, billingDate);
    const menuSet = getMenuSetName(planId);

    // 新しい配送予定を作成
    const deliveries = deliverySchedules.map(schedule => ({
      subscription_id: (dbSubscription as any).id,
      scheduled_date: schedule.scheduled_date.toISOString().split('T')[0],
      menu_set: menuSet,
      meals_per_delivery: schedule.meals_per_delivery,
      quantity: 1,
      status: 'pending',
      stripe_invoice_id: invoice.id,
    }));

    const { error: deliveryError } = await (supabase
      .from('subscription_deliveries') as any)
      .insert(deliveries);

    if (deliveryError) {
      console.error('Failed to create monthly delivery schedules:', deliveryError);
    }

    // サブスクリプションの期間を更新
    const { error: updateError } = await (supabase
      .from('subscriptions') as any)
      .update({
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        next_delivery_date: deliverySchedules[0]?.scheduled_date.toISOString().split('T')[0] || null,
        payment_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', (dbSubscription as any).id);

    if (updateError) {
      console.error('Failed to update subscription period:', updateError);
    }

    console.log(`Monthly payment processed for subscription: ${(dbSubscription as any).id}`);

  } catch (error) {
    console.error('Error handling monthly subscription payment:', error);
  }
}

// サブスクリプション更新時の処理
async function updateSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available');
    return;
  }

  try {
    // ステータスのマッピング
    let status = 'active';
    let paymentStatus = 'active';
    
    if (subscription.status === 'canceled' || subscription.canceled_at) {
      status = 'canceled';
      paymentStatus = 'canceled';
    } else if (subscription.status === 'past_due') {
      status = 'past_due';
      paymentStatus = 'past_due';
    } else if (subscription.status === 'unpaid') {
      status = 'past_due';
      paymentStatus = 'unpaid';
    } else if (subscription.status === 'paused') {
      status = 'paused';
    }

    const { error: updateError } = await (supabase
      .from('subscriptions') as any)
      .update({
        status: status,
        payment_status: paymentStatus,
        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        canceled_at: subscription.canceled_at 
          ? new Date(subscription.canceled_at * 1000).toISOString() 
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
    } else {
      console.log(`Subscription ${subscription.id} updated to status: ${status}`);
    }

  } catch (error) {
    console.error('Error updating subscription from Stripe:', error);
  }
}

// 支払い失敗時の処理
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available');
    return;
  }

  const stripeSubscriptionId = (invoice as any).subscription as string;
  if (!stripeSubscriptionId) return;

  try {
    // サブスクリプションのステータスを更新
    const { data: dbSubscription, error: fetchError } = await (supabase
      .from('subscriptions') as any)
      .select('*')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .single();

    if (fetchError || !dbSubscription) {
      console.error('Subscription not found:', fetchError);
      return;
    }

    await (supabase
      .from('subscriptions') as any)
      .update({
        payment_status: 'past_due',
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', (dbSubscription as any).id);

    // 支払い失敗通知メール送信
    const shippingAddress = (dbSubscription as any).shipping_address as any;
    if (shippingAddress?.email) {
      await sendPaymentFailedEmail({
        email: shippingAddress.email,
        name: shippingAddress.name || 'お客様',
        planName: (dbSubscription as any).plan_name,
      });
    }

    console.log(`Payment failed for subscription: ${(dbSubscription as any).id}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// サブスクリプション解約処理
async function cancelSubscription(subscription: Stripe.Subscription) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available');
    return;
  }

  try {
    // サブスクリプションを解約済みに更新
    const { error: updateError } = await (supabase
      .from('subscriptions') as any)
      .update({
        status: 'canceled',
        payment_status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (updateError) {
      console.error('Failed to cancel subscription:', updateError);
      return;
    }

    // pending状態の配送をキャンセル
    const { data: dbSubscription } = await (supabase
      .from('subscriptions') as any)
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (dbSubscription) {
      await (supabase
        .from('subscription_deliveries') as any)
        .update({ status: 'cancelled' })
        .eq('subscription_id', (dbSubscription as any).id)
        .eq('status', 'pending');
    }

    console.log(`Subscription ${subscription.id} canceled`);

  } catch (error) {
    console.error('Error canceling subscription:', error);
  }
}

// メール送信関数
interface OrderEmailParams {
  email: string;
  name: string;
  orderId: string;
  amount: number;
  items: Stripe.LineItem[];
}

async function sendOrderConfirmationEmail(params: OrderEmailParams) {
  const { email, name, amount, items } = params;

  const resend = await getResendClient();
  if (!resend) {
    console.log('RESEND_API_KEY is not set, skipping email');
    return;
  }

  const itemsList = items
    .map(item => `・${item.description} × ${item.quantity}`)
    .join('\n');

  const formatCurrency = (value: number) => new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(value);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #fff; padding: 30px; }
    .order-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${name} 様</p>
      <p>この度は「ふとるめし」をご注文いただき、誠にありがとうございます。</p>
      <p>ご注文内容を確認させていただきました。</p>

      <div class="order-details">
        <p style="margin-top: 0;"><strong>注文内容</strong></p>
        <pre style="font-family: inherit; white-space: pre-wrap;">${itemsList}</pre>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 15px 0;">
        <p><strong>合計金額:</strong> ${formatCurrency(amount)}</p>
      </div>

      <p>ご不明な点がございましたらご連絡ください。</p>

      <div class="footer">
        <p style="margin: 0;">LandBridge株式会社</p>
        <p style="margin: 5px 0;"><a href="mailto:info@landbridge.co.jp">info@landbridge.co.jp</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.FROM_EMAIL || 'ふとるめし <noreply@futorumeshi.com>';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: email,
    subject: '【ふとるめし】ご注文ありがとうございます',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send email:', error);
  }
}

// Slack通知
interface SlackNotificationParams {
  customerName: string;
  customerEmail: string;
  orderId: string;
  amount: number;
  items: Stripe.LineItem[];
}

async function sendSlackNotification(params: SlackNotificationParams) {
  const { customerName, customerEmail, orderId, amount, items } = params;

  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    console.log('SLACK_WEBHOOK_URL is not set');
    return;
  }

  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);

  const itemsList = items
    .map(item => `• ${item.description} × ${item.quantity}`)
    .join('\n');

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 新規注文（お試しプラン）',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*お客様名:*\n${customerName}` },
          { type: 'mrkdwn', text: `*メール:*\n${customerEmail}` },
        ],
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*注文番号:*\n${orderId.slice(-8).toUpperCase()}` },
          { type: 'mrkdwn', text: `*合計金額:*\n${formattedAmount}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*注文内容:*\n${itemsList}` },
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `📅 ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}` },
        ],
      },
    ],
  };

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}

// サブスクリプション購入完了メール
async function sendSubscriptionPurchaseConfirmationEmail(params: {
  email: string;
  name: string;
  subscriptionId: string;
  planName: string;
  monthlyAmount: number;
  deliverySchedules: Array<{ delivery_number: number; scheduled_date: Date; meals_per_delivery: number }>;
}) {
  const resend = await getResendClient();
  if (!resend) {
    console.log('RESEND_API_KEY is not set, skipping email');
    return;
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(value);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #fff; padding: 30px; }
    .delivery-schedule { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${params.name}様</p>
      <p>この度は「ふとるめし」月額プランをご購入いただき、誠にありがとうございます。</p>
      
      <div class="delivery-schedule">
        <p style="margin-top: 0;"><strong>${params.planName}</strong></p>
        <p>月額料金: ${formatCurrency(params.monthlyAmount)}</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 15px 0;">
        <p><strong>配送について</strong></p>
        <p>2月10日から順次配送いたしますので、もうしばらくお待ちください。</p>
      </div>

      <p>毎月自動で課金・配送されます。解約をご希望の場合はマイページからお申し出ください。</p>
      <p>ご不明な点がございましたらご連絡ください。</p>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ふとるめし <noreply@futorumeshi.com>';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: '【ふとるめし】月額プランのご購入ありがとうございます',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send subscription purchase confirmation email:', error);
  }
}

// サブスクリプションSlack通知
async function sendSubscriptionSlackNotification(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  monthlyAmount: number;
}) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) return;

  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(params.monthlyAmount);

  const message = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🎉 新規サブスクリプション契約！', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*お客様名:*\n${params.customerName}` },
          { type: 'mrkdwn', text: `*メール:*\n${params.customerEmail}` },
        ],
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*プラン:*\n${params.planName}` },
          { type: 'mrkdwn', text: `*月額:*\n${formattedAmount}` },
        ],
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `📅 ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}` },
        ],
      },
    ],
  };

  try {
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Error sending subscription Slack notification:', error);
  }
}

// 支払い失敗メール
async function sendPaymentFailedEmail(params: {
  email: string;
  name: string;
  planName: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #fff; padding: 30px; }
    .warning { background: #fef2f2; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${params.name}様</p>
      <div class="warning">
        <p style="margin-top: 0; color: #dc2626;"><strong>お支払いに問題が発生しました</strong></p>
        <p>「${params.planName}」の月額料金のお支払いが完了しませんでした。</p>
        <p>お手数ですが、決済方法をご確認の上、再度お試しください。</p>
      </div>
      <p>お支払いが確認できない場合、サブスクリプションが一時停止される場合があります。</p>
      <p>ご不明な点がございましたらご連絡ください。</p>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'ふとるめし <noreply@futorumeshi.com>';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: '【ふとるめし】お支払いに問題が発生しました',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send payment failed email:', error);
  }
}
