import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import {
  calculateInitialDeliverySchedule,
  calculateMonthlyDeliverySchedule,
  getPlanConfig,
  getPlanName,
  getMenuSetNameWithDeliveryNumber,
  isValidPlanId
} from '@/lib/subscription-schedule';

// 紹介コミッション金額定義
const INITIAL_COMMISSION: Record<string, number> = {
  'trial-6': 500,
  'subscription-monthly-12': 1000,
  'subscription-monthly-24': 2000,
  'subscription-monthly-48': 4000,
};
const RECURRING_COMMISSION: Record<string, number> = {
  'subscription-monthly-12': 300,
  'subscription-monthly-24': 500,
  'subscription-monthly-48': 800,
};

// 遅延初期化（ビルド時にエラーを防ぐ）
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Stripeサブスクリプションから期間情報を安全に取得（APIバージョン差異対応）
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  currentPeriodStart: number;
  currentPeriodEnd: number;
} {
  const currentPeriodStart = (subscription as any).current_period_start
    || subscription.items?.data?.[0]?.current_period_start
    || (subscription as any).billing_cycle_anchor
    || subscription.created;

  const currentPeriodEnd = (subscription as any).current_period_end
    || subscription.items?.data?.[0]?.current_period_end
    || (currentPeriodStart + 30 * 24 * 60 * 60); // fallback: +30 days

  return { currentPeriodStart, currentPeriodEnd };
}

// セット商品から必要なセット数を計算
function calculateSetsFromDescription(description: string): number {
  // 18食セット = 3セット
  if (description.includes('18食') || description.includes('18個')) {
    return 3;
  }
  // 12食セット = 2セット
  if (description.includes('12食') || description.includes('12個')) {
    return 2;
  }
  // 6食セット = 1セット
  if (description.includes('6食') || description.includes('6個')) {
    return 1;
  }
  // 数字抽出を試みる
  const match = description.match(/(\d+)(?:食|個)/);
  if (match) {
    const meals = parseInt(match[1], 10);
    return Math.ceil(meals / 6);
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

// コミッション記録用ヘルパー関数
async function recordReferralCommission(params: {
  referralCode: string;
  sourceType: 'order' | 'subscription_initial' | 'subscription_recurring';
  sourceId: string;
  stripeInvoiceId?: string;
  planId: string;
  commissionType: 'initial' | 'recurring';
  commissionAmount: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('[Commission] Supabase client not available');
    return;
  }

  try {
    const { error } = await (supabase
      .from('referral_commissions') as any)
      .insert({
        referral_code: params.referralCode,
        source_type: params.sourceType,
        source_id: params.sourceId,
        stripe_invoice_id: params.stripeInvoiceId || null,
        plan_id: params.planId,
        commission_type: params.commissionType,
        commission_amount: params.commissionAmount,
        billing_period_start: params.billingPeriodStart || null,
        billing_period_end: params.billingPeriodEnd || null,
      });

    if (error) {
      console.error('[Commission] Failed to record commission:', error);
    } else {
      console.log(`[Commission] Recorded ${params.commissionType} commission: ¥${params.commissionAmount} for code ${params.referralCode} (${params.planId})`);
    }
  } catch (error) {
    console.error('[Commission] Error recording commission:', error);
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

  // 送料を除外した商品のみをフィルタリング
  const productItems = lineItems.data.filter(item => {
    const description = item.description?.toLowerCase() || '';
    // 送料アイテムを除外（「送料」「shipping」を含むものを除外）
    return !description.includes('送料') && !description.includes('shipping');
  });

  // 注文内容を文字列に変換（商品のみ）
  const menuSet = productItems
    .map(item => `${item.description} × ${item.quantity}`)
    .join(', ');

  // 住所を取得
  const addressString = session.metadata?.address || '';

  // 数量を計算（商品のみ、送料は除外）
  const totalQuantity = productItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

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
      const referralCode = session.metadata?.referral_code || '';
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
          referral_code: referralCode || null,
        });

      if (dbError) {
        console.error('Failed to save order to database:', dbError);
      } else {
        console.log('Order saved to database successfully', referralCode ? `(referral: ${referralCode})` : '');

        // 初回コミッション記録（お試しプラン）
        if (referralCode && INITIAL_COMMISSION['trial-6']) {
          await recordReferralCommission({
            referralCode,
            sourceType: 'order',
            sourceId: session.id,
            planId: 'trial-6',
            commissionType: 'initial',
            commissionAmount: INITIAL_COMMISSION['trial-6'],
          });
        }
      }
    } catch (error) {
      console.error('Error saving order to database:', error);
    }
  }

  // メール送信（商品のみ表示）
  await sendOrderConfirmationEmail({
    email: customerEmail,
    name: customerName || 'お客様',
    orderId: session.id,
    amount: amountTotal || 0,
    items: productItems,
  });

  // Slack通知（商品のみ表示）
  await sendSlackNotification({
    customerName: customerName || 'お客様',
    customerEmail: customerEmail,
    orderId: session.id,
    amount: amountTotal || 0,
    items: productItems,
  });

  // 在庫を減らす（商品のみ対象）
  await reduceInventory(productItems);

  console.log('One-time order processed successfully');
}

// 在庫を減らす関数（セット単位）
async function reduceInventory(items: Stripe.LineItem[]) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available, inventory not reduced');
    return;
  }

  // 購入された商品から必要なセット数を計算
  let setsToReduce = 0;
  for (const item of items) {
    const description = item.description || '';
    const quantity = item.quantity || 1;
    const setsPerItem = calculateSetsFromDescription(description);
    setsToReduce += setsPerItem * quantity;
  }

  if (setsToReduce === 0) {
    console.log('No sets to reduce from inventory');
    return;
  }

  try {
    // 現在のセット在庫を取得
    const { data: current, error: fetchError } = await (supabase
      .from('inventory_settings') as any)
      .select('id, stock_sets')
      .eq('set_type', '6-set')
      .single();

    if (fetchError) {
      console.error('Failed to fetch inventory settings:', fetchError);
      return;
    }

    if (!current) {
      console.error('No inventory settings found');
      return;
    }

    const currentStock = current.stock_sets || 0;
    const newStock = Math.max(0, currentStock - setsToReduce);

    // セット在庫を更新
    const { error: updateError } = await (supabase
      .from('inventory_settings') as any)
      .update({
        stock_sets: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('set_type', '6-set');

    if (updateError) {
      console.error('Failed to update inventory settings:', updateError);
    } else {
      console.log(`Set inventory updated: ${currentStock} -> ${newStock} (reduced by ${setsToReduce} sets)`);
    }
  } catch (error) {
    console.error('Error reducing inventory:', error);
  }
}

// inventory_settingsのstock_setsを減算する共通関数
async function reduceInventorySets(setsToReduce: number, reason: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('[Webhook] Supabase client not available, inventory not reduced');
    return;
  }

  if (setsToReduce <= 0) {
    return;
  }

  try {
    const { data: current, error: fetchError } = await (supabase
      .from('inventory_settings') as any)
      .select('id, stock_sets')
      .eq('set_type', '6-set')
      .single();

    if (fetchError || !current) {
      console.error('[Webhook] Failed to fetch inventory settings:', fetchError);
      return;
    }

    const currentStock = current.stock_sets || 0;
    const newStock = Math.max(0, currentStock - setsToReduce);

    const { error: updateError } = await (supabase
      .from('inventory_settings') as any)
      .update({
        stock_sets: newStock,
        updated_at: new Date().toISOString(),
      })
      .eq('set_type', '6-set');

    if (updateError) {
      console.error('[Webhook] Failed to update inventory settings:', updateError);
    } else {
      console.log(`[Webhook] Inventory reduced: ${currentStock} -> ${newStock} (${setsToReduce} sets, ${reason})`);
    }
  } catch (error) {
    console.error('[Webhook] Error reducing inventory:', error);
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

    // 配送スケジュールを計算（購入日=請求開始日を基準）
    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription);

    const startDate = preferredDeliveryDateStr
      ? new Date(preferredDeliveryDateStr)
      : new Date(currentPeriodStart * 1000); // 購入日（請求開始日）

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
    // 紹介コードを取得
    let referralCode = checkoutSession?.metadata?.referral_code || subscription.metadata?.referral_code || '';

    // 再契約チェック: 同じメールアドレスまたはuser_idでcanceledのサブスクが存在する場合、紹介コードを無効化
    if (referralCode) {
      try {
        let hasCancel = false;
        if (customerEmail) {
          const { data: canceledByEmail } = await (supabase
            .from('subscriptions') as any)
            .select('id')
            .eq('status', 'canceled')
            .contains('shipping_address', JSON.stringify({ email: customerEmail }))
            .limit(1);
          if (canceledByEmail && canceledByEmail.length > 0) {
            hasCancel = true;
          }
        }
        if (!hasCancel && userId) {
          const { data: canceledByUser } = await (supabase
            .from('subscriptions') as any)
            .select('id')
            .eq('status', 'canceled')
            .eq('user_id', userId)
            .limit(1);
          if (canceledByUser && canceledByUser.length > 0) {
            hasCancel = true;
          }
        }
        if (hasCancel) {
          console.log(`[Webhook] Re-subscription detected for ${customerEmail || userId}. Clearing referral code.`);
          referralCode = '';
        }
      } catch (resubCheckError) {
        console.error('[Webhook] Error checking re-subscription:', resubCheckError);
        // エラー時は安全側に倒してreferralCodeをそのまま使用
      }
    }

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
        current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
        started_at: new Date(subscription.created * 1000).toISOString(),
        referral_code: referralCode || null,
      })
      .select()
      .single();

    if (subError || !dbSubscription) {
      console.error('[Webhook] Failed to create subscription:', subError);
      throw new Error(`Failed to create subscription: ${subError?.message}`);
    }
    
    console.log(`[Webhook] Subscription created in DB: ${(dbSubscription as any).id}`);

    // 初回コミッション記録（サブスクリプション）
    if (referralCode && INITIAL_COMMISSION[planId]) {
      await recordReferralCommission({
        referralCode,
        sourceType: 'subscription_initial',
        sourceId: (dbSubscription as any).id,
        planId,
        commissionType: 'initial',
        commissionAmount: INITIAL_COMMISSION[planId],
        billingPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
        billingPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
      });
    }

    // subscription_deliveriesテーブルに初回配送予定を作成
    const deliveries = deliverySchedules.map((schedule) => ({
      subscription_id: (dbSubscription as any).id,
      scheduled_date: schedule.scheduled_date.toISOString().split('T')[0],
      menu_set: getMenuSetNameWithDeliveryNumber(planId, schedule.delivery_number),
      meals_per_delivery: schedule.meals_per_delivery,
      quantity: 1,
      status: 'pending',
      customer_email: customerEmail,
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

    // 在庫を減算（deliveries_per_month × 2セット）
    const setsToReduce = planConfig.deliveries_per_month * 2;
    await reduceInventorySets(setsToReduce, `subscription created: ${planName}`);

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
    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription);
    const billingDate = new Date(currentPeriodStart * 1000);
    const deliverySchedules = calculateMonthlyDeliverySchedule(planId, billingDate);
    const customerEmail = (dbSubscription as any).shipping_address?.email || '';

    // 新しい配送予定を作成
    const deliveries = deliverySchedules.map(schedule => ({
      subscription_id: (dbSubscription as any).id,
      scheduled_date: schedule.scheduled_date.toISOString().split('T')[0],
      menu_set: getMenuSetNameWithDeliveryNumber(planId, schedule.delivery_number),
      meals_per_delivery: schedule.meals_per_delivery,
      quantity: 1,
      status: 'pending',
      stripe_invoice_id: invoice.id,
      customer_email: customerEmail,
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
        current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
        next_delivery_date: deliverySchedules[0]?.scheduled_date.toISOString().split('T')[0] || null,
        payment_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', (dbSubscription as any).id);

    if (updateError) {
      console.error('Failed to update subscription period:', updateError);
    }

    // 在庫を減算（deliveries_per_month × 2セット）
    const planConfig = getPlanConfig(planId);
    const setsToReduce = planConfig.deliveries_per_month * 2;
    await reduceInventorySets(setsToReduce, `monthly payment: ${planId}`);

    // 継続コミッション記録
    const dbReferralCode = (dbSubscription as any).referral_code;
    if (dbReferralCode && RECURRING_COMMISSION[planId]) {
      await recordReferralCommission({
        referralCode: dbReferralCode,
        sourceType: 'subscription_recurring',
        sourceId: (dbSubscription as any).id,
        stripeInvoiceId: invoice.id,
        planId,
        commissionType: 'recurring',
        commissionAmount: RECURRING_COMMISSION[planId],
        billingPeriodStart: new Date(currentPeriodStart * 1000).toISOString(),
        billingPeriodEnd: new Date(currentPeriodEnd * 1000).toISOString(),
      });
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

    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription);

    const { error: updateError } = await (supabase
      .from('subscriptions') as any)
      .update({
        status: status,
        payment_status: paymentStatus,
        current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
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

      <div class="order-details">
        <p style="margin-top: 0;"><strong>配送について</strong></p>
        <p>2月10日より順次配送いたします。もうしばらくお待ちください。</p>
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
