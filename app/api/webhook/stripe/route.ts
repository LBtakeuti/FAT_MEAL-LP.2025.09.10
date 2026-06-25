import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';
import {
  calculateInitialDeliverySchedule,
  calculateMonthlyDeliverySchedule,
  getPlanConfig,
  getPlanName,
  getMenuSetNameWithDeliveryNumber,
  isValidPlanId,
  inheritPreferredDateForBilling,
} from '@/lib/subscription-schedule';
import { getPlanDisplayName } from '@/lib/plan-labels';
import { postSlack } from '@/lib/slack';

// 紹介コミッション金額定義（新プラン体系 + legacy）
const INITIAL_COMMISSION: Record<string, number> = {
  'trial-6': 500,
  'sub-6': 500,
  'sub-12': 1000,
  'subscription-monthly-12': 1000, // legacy
};
const RECURRING_COMMISSION: Record<string, number> = {
  'sub-6': 200,
  'sub-12': 300,
  'subscription-monthly-12': 300, // legacy
};

// 旧プランID（subscription-monthly-12 など）を新プランIDに正規化して扱う。
// 既存契約者の plan_id は subscriptions テーブルに残存しているため、
// PLAN_CONFIGS / コミッション参照では legacy ID をそのまま使う（互換ルックアップ）。
function resolveLegacyPlanId(planId: string): string {
  return planId;
}

// 遅延初期化（ビルド時にエラーを防ぐ）
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// Stripe API バージョン 2024-09-30 以降は invoice.subscription が削除され、
// invoice.parent.subscription_details.subscription に移動している。
// 旧バージョン互換のため両方を見るヘルパー。
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const fromParent = (invoice as any).parent?.subscription_details?.subscription;
  const fromLegacy = (invoice as any).subscription;
  const sub = fromParent || fromLegacy;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
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

// セット商品の description から必要なセット数（1セット=6食換算）を計算。
// 新体系は 6食 / 12食 のみ。description から食数を抽出して 6 で割る。
function calculateSetsFromDescription(description: string): number {
  if (description.includes('12食') || description.includes('12個')) {
    return 2;
  }
  if (description.includes('6食') || description.includes('6個')) {
    return 1;
  }
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

// 個別メッセージ(share-link) 経由の購入コンバージョン記録
// shareSlug: /share/<slug> から sessionStorage 経由で Stripe metadata に載った識別子
// recurring 時は subscription_id ベースで初回 conversion を引いて再利用するため、
// shareSlug が空でも sourceId 経由で解決可能。
async function recordShareLinkConversion(params: {
  shareSlug?: string;
  sourceType: 'order' | 'subscription_initial' | 'subscription_recurring';
  sourceId: string;
  stripeInvoiceId?: string;
  planId: string;
}) {
  const baseSupabase = getSupabaseClient();
  if (!baseSupabase) return;
  const supabase = baseSupabase as any;

  try {
    let shareLinkId: string | null = null;

    if (params.shareSlug) {
      const { data: link } = await supabase
        .from('share_links')
        .select('id')
        .eq('slug', params.shareSlug)
        .maybeSingle();
      shareLinkId = link?.id || null;
    }

    // recurring の場合は subscription の初回 conversion から share_link_id を引く
    if (!shareLinkId && params.sourceType === 'subscription_recurring') {
      const { data: prev } = await supabase
        .from('share_link_conversions')
        .select('share_link_id')
        .eq('source_id', params.sourceId)
        .eq('source_type', 'subscription_initial')
        .maybeSingle();
      shareLinkId = prev?.share_link_id || null;
    }

    if (!shareLinkId) return; // share-link 経由じゃない購入は無視

    const { error } = await supabase
      .from('share_link_conversions')
      .insert({
        share_link_id: shareLinkId,
        source_type: params.sourceType,
        source_id: params.sourceId,
        stripe_invoice_id: params.stripeInvoiceId || null,
        plan_id: params.planId,
      });

    if (error) {
      // stripe_invoice_id UNIQUE 違反は重複記録防止のための想定挙動なので無視
      const code = (error as { code?: string }).code;
      if (code !== '23505') {
        console.error('[ShareLinkConversion] Failed to record:', error);
      }
    } else {
      console.log(`[ShareLinkConversion] Recorded ${params.sourceType} for share_link ${shareLinkId} (plan ${params.planId})`);
    }
  } catch (error) {
    console.error('[ShareLinkConversion] Error:', error);
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
        
        // ふとるめし以外の商品（他プロジェクト）をフィルタリング
        if (session.metadata?.purchase_type !== 'one-time') {
          console.log(`[Webhook] Skipping checkout.session.completed: purchase_type="${session.metadata?.purchase_type}" is not "one-time" (session: ${session.id})`);
          break;
        }

        // 一回購入の場合
        await handleSuccessfulPayment(session, stripe);
        break;
      }

      // PaymentIntent決済完了（Stripe Elements経由の買い切り）
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        // Stripe Elements経由の買い切り注文のみ処理（purchase_typeメタデータで判定）
        if (paymentIntent.metadata?.purchase_type === 'one-time') {
          console.log(`[Webhook] PaymentIntent succeeded for one-time purchase: ${paymentIntent.id}`);
          await handlePaymentIntentSucceeded(paymentIntent, stripe);
        }
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
        if (getInvoiceSubscriptionId(invoice)) {
          if (invoice.billing_reason === 'subscription_cycle') {
            await handleMonthlySubscriptionPayment(invoice, stripe);
          }
          // subscription_create: createSubscriptionFromStripe内で処理済み
          // subscription_update: スキップ（スケジュール調整など）
        }
        break;
      }

      // サブスクリプションの請求失敗時
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (getInvoiceSubscriptionId(invoice)) {
          await handlePaymentFailed(invoice);
        }
        break;
      }

      // サブスクリプション削除時（解約 or 決済未完了の失効）
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // B2: 一度も決済成功していない＝「決済未完了の失効」かを判定し、
        //     解約メールの誤送信を防ぐ。
        if (isPaymentIncompleteExpiry(subscription)) {
          await handleIncompletePaymentExpiry(subscription, stripe);
        } else {
          await cancelSubscription(subscription);
        }
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
  const customerName = session.metadata?.customer_name || 'お客様';
  const customerPhone = session.customer_details?.phone || session.metadata?.phone;
  const amountTotal = session.amount_total;

  if (!customerEmail) {
    console.error('No customer email found in session');
    return;
  }

  // 冪等性チェック: 同じセッションで既に注文が作成されていればスキップ
  const idempotencySupabase = getSupabaseClient();
  if (idempotencySupabase) {
    const { data: existing } = await (idempotencySupabase.from('orders') as any)
      .select('id')
      .eq('stripe_session_id', session.id)
      .maybeSingle();
    if (existing) {
      console.log(`[Checkout] Order already exists for session ${session.id}, skipping`);
      return;
    }
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
      const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
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
      // F1: 暫定で今日(JST)を preferred_delivery_date に入れる（F3 でユーザー指定値に差し替え）
      const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: insertedOrder, error: dbError } = await (supabase
        .from('orders') as any)
        .insert({
          user_id: userId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string || null,
          customer_name: customerName || 'お客様',
          customer_name_kana: session.metadata?.customer_name_kana || '',
          customer_email: customerEmail,
          phone: customerPhone || session.metadata?.phone || '',
          postal_code: session.metadata?.postal_code || '',
          prefecture: session.metadata?.prefecture || '',
          city: session.metadata?.city || '',
          address_detail: session.metadata?.address_detail || '',
          building: session.metadata?.building || '',
          address: addressString,
          menu_set: menuSet,
          quantity: totalQuantity,
          amount: amountTotal || 0,
          currency: session.currency || 'jpy',
          status: 'pending',
          referral_code: referralCode || null,
          notes: session.metadata?.notes || null,
          preferred_delivery_date: todayJST,
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('Failed to save order to database:', dbError);
      } else {
        console.log('Order saved to database successfully', referralCode ? `(referral: ${referralCode})` : '');

        // アンケートを注文に紐付け
        if (insertedOrder?.id) {
          await (supabase.from('purchase_surveys') as any)
            .update({ order_id: insertedOrder.id })
            .eq('stripe_session_id', session.id);
        }

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

        // share-link(個別メッセージ) 経由のコンバージョン記録
        await recordShareLinkConversion({
          shareSlug: session.metadata?.share_slug || undefined,
          sourceType: 'order',
          sourceId: session.id,
          planId: 'trial-6',
        });

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

// Stripe Elements経由の買い切り注文処理（PaymentIntent.succeeded）
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, _stripe: Stripe) {
  const metadata = paymentIntent.metadata;
  const customerEmail = metadata?.email;
  const customerName = metadata?.customer_name || 'お客様';
  const amount = paymentIntent.amount;

  if (!customerEmail) {
    console.error('[PaymentIntent] No customer email in metadata');
    return;
  }

  const supabase = getSupabaseClient();

  // 冪等性チェック: 同じPaymentIntentで既に注文が作成されていればスキップ
  if (supabase) {
    const { data: existing } = await (supabase.from('orders') as any)
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .maybeSingle();
    if (existing) {
      console.log(`[PaymentIntent] Order already exists for ${paymentIntent.id}, skipping`);
      return;
    }
  }

  // ユーザーIDを取得
  let userId: string | null = null;
  if (supabase) {
    try {
      const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const user = users?.users?.find(u => u.email === customerEmail);
      userId = user?.id || null;
    } catch { /* ユーザーが見つからない場合はnull */ }
  }

  // プランIDからメニューセット名を生成（F11: 統一ヘルパー、数量・回数表記なし）
  const planId = metadata?.plan_id || 'trial-6';
  const menuSet = getPlanDisplayName(planId);

  // 注文をDBに保存
  if (supabase) {
    try {
      const referralCode = metadata?.referral_code || '';
      // F1: 暫定で今日(JST)を preferred_delivery_date に入れる（F3 でユーザー指定値に差し替え）
      const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: insertedOrder, error: dbError } = await (supabase.from('orders') as any)
        .insert({
          user_id: userId,
          stripe_session_id: paymentIntent.id,
          stripe_payment_intent_id: paymentIntent.id,
          customer_name: customerName,
          customer_name_kana: metadata?.customer_name_kana || '',
          customer_email: customerEmail,
          phone: metadata?.phone || '',
          postal_code: metadata?.postal_code || '',
          prefecture: metadata?.prefecture || '',
          city: metadata?.city || '',
          address_detail: metadata?.address_detail || '',
          building: metadata?.building || '',
          address: metadata?.address || '',
          menu_set: menuSet,
          quantity: 1,
          amount,
          currency: paymentIntent.currency || 'jpy',
          status: 'pending',
          referral_code: referralCode || null,
          notes: metadata?.notes || null,
          preferred_delivery_date: todayJST,
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('[PaymentIntent] Failed to save order:', dbError);
      } else {
        console.log('[PaymentIntent] Order saved successfully');

        // アンケートを注文に紐付け
        if (insertedOrder?.id) {
          await (supabase.from('purchase_surveys') as any)
            .update({ order_id: insertedOrder.id })
            .eq('stripe_session_id', paymentIntent.id);
        }

        // 紹介コミッション
        if (referralCode && INITIAL_COMMISSION[planId as keyof typeof INITIAL_COMMISSION]) {
          await recordReferralCommission({
            referralCode,
            sourceType: 'order',
            sourceId: paymentIntent.id,
            planId,
            commissionType: 'initial',
            commissionAmount: INITIAL_COMMISSION[planId as keyof typeof INITIAL_COMMISSION],
          });
        }

        // share-link(個別メッセージ) 経由のコンバージョン記録
        await recordShareLinkConversion({
          shareSlug: metadata?.share_slug || undefined,
          sourceType: 'order',
          sourceId: paymentIntent.id,
          planId,
        });

      }
    } catch (error) {
      console.error('[PaymentIntent] Error saving order:', error);
    }
  }

  // メール送信
  await sendOrderConfirmationEmail({
    email: customerEmail,
    name: customerName,
    orderId: paymentIntent.id,
    amount,
    items: [{ description: menuSet, quantity: 1 } as Stripe.LineItem],
  });

  // Slack通知
  await sendSlackNotification({
    customerName,
    customerEmail,
    orderId: paymentIntent.id,
    amount,
    items: [{ description: menuSet, quantity: 1 } as Stripe.LineItem],
  });

  // 在庫削減（1セット）
  await reduceInventorySets(1, `payment_intent: ${planId}`);

  console.log('[PaymentIntent] One-time order processed successfully');
}

// 在庫を減らす関数（セット単位）
// F47-C: SELECT→計算→UPDATE の3ステップを Supabase RPC（decrement_stock_sets）で
//        単一UPDATEに置換。並列Webhook時の競合（race condition）を防ぐ。
//        RPC 戻り値 NULL = 在庫不足で更新せず、現在の挙動と同じ「更新しないが処理は止めない」。
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
    // F47-C: アトミックに減算（RPC）。NULL なら在庫不足。
    const { data: newStock, error: rpcError } = await (supabase as any).rpc(
      'decrement_stock_sets',
      { p_set_type: '6-set', p_n: setsToReduce }
    );

    if (rpcError) {
      console.error('Failed to decrement_stock_sets (RPC):', rpcError);
      return;
    }
    if (newStock === null || newStock === undefined) {
      console.warn(`[Inventory] decrement_stock_sets returned NULL: stock < ${setsToReduce}（在庫不足のため未更新）`);
      return;
    }
    console.log(`Set inventory updated (atomic): -> ${newStock} (reduced by ${setsToReduce} sets)`);
  } catch (error) {
    console.error('Error reducing inventory:', error);
  }
}

// inventory_settingsのstock_setsを減算する共通関数
// F47-C: RPC（decrement_stock_sets）でアトミック化。
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
    const { data: newStock, error: rpcError } = await (supabase as any).rpc(
      'decrement_stock_sets',
      { p_set_type: '6-set', p_n: setsToReduce }
    );

    if (rpcError) {
      console.error('[Webhook] Failed to decrement_stock_sets (RPC):', rpcError);
      return;
    }
    if (newStock === null || newStock === undefined) {
      console.warn(`[Webhook] decrement_stock_sets returned NULL: stock < ${setsToReduce}（在庫不足のため未更新）`);
      return;
    }
    console.log(`[Webhook] Inventory reduced (atomic): -> ${newStock} (${setsToReduce} sets, ${reason})`);
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
    const rawPlanId = subscription.metadata?.plan_id ||
                      checkoutSession?.metadata?.plan_id || '';
    const planId = resolveLegacyPlanId(rawPlanId);

    console.log(`[Webhook] Plan ID: ${planId}`);

    if (!planId || !isValidPlanId(planId)) {
      console.error(`[Webhook] Invalid plan ID: ${planId}`);
      console.error(`[Webhook] subscription.metadata: ${JSON.stringify(subscription.metadata)}`);
      console.error(`[Webhook] checkoutSession.metadata: ${JSON.stringify(checkoutSession?.metadata)}`);
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Stripe Elements 新フローでは Checkout Session が存在しないため、
    // subscription.metadata（activate-subscription で書き込まれる）→ checkoutSession.metadata
    // → Stripe Customer の順でフォールバック
    let customerEmail = checkoutSession?.customer_details?.email ||
                        checkoutSession?.customer_email ||
                        subscription.metadata?.email ||
                        checkoutSession?.metadata?.email || '';
    let customerName = subscription.metadata?.customer_name ||
                       checkoutSession?.metadata?.customer_name || '';

    if (!customerEmail || !customerName) {
      try {
        const stripeCustomer = await stripe.customers.retrieve(subscription.customer as string);
        if (stripeCustomer && !(stripeCustomer as any).deleted) {
          const c = stripeCustomer as Stripe.Customer;
          if (!customerEmail) customerEmail = c.email || '';
          if (!customerName) customerName = c.name || '';
        }
      } catch (customerError) {
        console.error('[Webhook] Failed to retrieve Stripe customer:', customerError);
      }
    }

    if (!customerName) customerName = 'お客様';

    const preferredDeliveryDateStr = subscription.metadata?.preferred_delivery_date ||
                                     checkoutSession?.metadata?.preferred_delivery_date || '';
    
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
        const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
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
    console.log(`[Webhook] Referral code from checkout metadata: ${checkoutSession?.metadata?.referral_code}`);
    console.log(`[Webhook] Referral code from subscription metadata: ${subscription.metadata?.referral_code}`);
    console.log(`[Webhook] Final referral code: ${referralCode}`);

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
        monthly_shipping_fee: planConfig.monthly_shipping_fee ?? planConfig.shipping_fee_per_delivery * planConfig.deliveries_per_month,
        monthly_total_amount: planConfig.monthly_total,
        next_delivery_date: deliverySchedules[0]?.scheduled_date.toISOString().split('T')[0] || null,
        preferred_delivery_date: preferredDeliveryDateStr || null,
        shipping_address: {
          name: customerName,
          email: customerEmail,
          phone: subscription.metadata?.phone || checkoutSession?.metadata?.phone || '',
          postal_code: subscription.metadata?.postal_code || checkoutSession?.metadata?.postal_code || '',
          prefecture: subscription.metadata?.prefecture || checkoutSession?.metadata?.prefecture || '',
          city: subscription.metadata?.city || checkoutSession?.metadata?.city || '',
          address_detail: subscription.metadata?.address_detail || checkoutSession?.metadata?.address_detail || '',
          building: subscription.metadata?.building || checkoutSession?.metadata?.building || '',
        },
        status: 'active',
        payment_status: 'active',
        current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
        started_at: new Date(subscription.created * 1000).toISOString(),
        referral_code: referralCode || null,
        notes: subscription.metadata?.notes || checkoutSession?.metadata?.notes || null,
      })
      .select()
      .single();

    if (subError || !dbSubscription) {
      console.error('[Webhook] Failed to create subscription:', subError);
      throw new Error(`Failed to create subscription: ${subError?.message}`);
    }
    
    console.log(`[Webhook] Subscription created in DB: ${(dbSubscription as any).id}`);

    // アンケートをサブスクリプションに紐付け
    if (checkoutSession?.id) {
      await (supabase.from('purchase_surveys') as any)
        .update({ subscription_id: (dbSubscription as any).id })
        .eq('stripe_session_id', checkoutSession.id);
    }

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

    // share-link(個別メッセージ) 経由のコンバージョン記録（初回）
    const initialShareSlug = checkoutSession?.metadata?.share_slug || subscription.metadata?.share_slug || undefined;
    await recordShareLinkConversion({
      shareSlug: initialShareSlug,
      sourceType: 'subscription_initial',
      sourceId: (dbSubscription as any).id,
      planId,
    });

    // subscription_deliveriesテーブルに初回配送予定を作成
    const deliveries = deliverySchedules.map((schedule) => {
      const scheduledDateStr = schedule.scheduled_date.toISOString().split('T')[0];
      return {
        subscription_id: (dbSubscription as any).id,
        scheduled_date: scheduledDateStr,
        // F1: 初期は scheduled_date と同値（F3 でユーザー指定値に差し替え）
        preferred_delivery_date: scheduledDateStr,
        menu_set: getMenuSetNameWithDeliveryNumber(planId, schedule.delivery_number),
        meals_per_delivery: schedule.meals_per_delivery,
        quantity: 1,
        status: 'pending',
        customer_email: customerEmail,
      };
    });

    const { error: deliveryError } = await (supabase
      .from('subscription_deliveries') as any)
      .insert(deliveries);

    if (deliveryError) {
      console.error('Failed to create delivery schedules:', deliveryError);
    }

    console.log(`Subscription created: ${(dbSubscription as any).id} with ${deliveries.length} initial deliveries`);

    // 初回請求額を取得（Phase1実額）
    let initialInvoiceAmount = planConfig.monthly_total; // フォールバック
    if (subscription.latest_invoice) {
      try {
        const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
        if (latestInvoice.amount_paid > 0) {
          initialInvoiceAmount = latestInvoice.amount_paid;
        }
      } catch (invoiceError) {
        console.warn('[Webhook] Failed to retrieve latest invoice, using planConfig price:', invoiceError);
      }
    }

    // 購入完了メール送信（実際の請求額を使用）
    await sendSubscriptionPurchaseConfirmationEmail({
      email: customerEmail,
      name: customerName,
      subscriptionId: (dbSubscription as any).id,
      planName: planName,
      monthlyAmount: initialInvoiceAmount,
      deliverySchedules: deliverySchedules,
    });

    // Slack通知（実際の請求額を使用）
    await sendSubscriptionSlackNotification({
      customerName: customerName,
      customerEmail: customerEmail,
      planName: planName,
      monthlyAmount: initialInvoiceAmount,
    });

    // 在庫を減算（1セット=6食換算: sub-6=1セット, sub-12=2セット）
    const setsToReduce = Math.max(1, Math.floor(planConfig.meals_per_delivery / 6));
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

  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice) as string;
  if (!stripeSubscriptionId) {
    console.error('No subscription ID in invoice');
    return;
  }

  try {
    // サブスクリプションを取得
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

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

    // plan_id: Stripe metadata → DB の plan_id の順で取得（legacy ID も許容）
    const rawPlanId = subscription.metadata?.plan_id || (dbSubscription as any).plan_id || '';
    const planId = resolveLegacyPlanId(rawPlanId);

    if (!planId || !isValidPlanId(planId)) {
      console.error(`Invalid plan ID: ${planId}`);
      return;
    }

    // 月次配送スケジュールを計算
    const { currentPeriodStart, currentPeriodEnd } = getSubscriptionPeriod(subscription);
    const billingDate = new Date(currentPeriodStart * 1000);
    const deliverySchedules = calculateMonthlyDeliverySchedule(planId, billingDate);
    const customerEmail = (dbSubscription as any).shipping_address?.email || '';

    // F9-1: 初回購入時の preferred_delivery_date を 2回目以降の配送日にも継承する。
    //   - preferred_delivery_date が存在する場合: 「billingDate の年月」+「初回希望日の日（day-of-month）」で算出
    //   - 翌月にその日が無い場合（例: 1/31 → 2月）は月末日へフォールバック
    //   - preferred_delivery_date が null（旧プラン体系の既存契約者）: 従来通り calculateMonthlyDeliverySchedule の billingDate ベース
    const preferredAnchor = (dbSubscription as any).preferred_delivery_date as string | null | undefined;
    const inheritedScheduledDate = preferredAnchor
      ? inheritPreferredDateForBilling(preferredAnchor, billingDate)
      : null;

    // 新しい配送予定を作成
    const deliveries = deliverySchedules.map(schedule => {
      const scheduledDateStr = inheritedScheduledDate ?? schedule.scheduled_date.toISOString().split('T')[0];
      return {
        subscription_id: (dbSubscription as any).id,
        scheduled_date: scheduledDateStr,
        // F9-1: scheduled_date と preferred_delivery_date は同じ値で揃える
        preferred_delivery_date: scheduledDateStr,
        menu_set: getMenuSetNameWithDeliveryNumber(planId, schedule.delivery_number),
        meals_per_delivery: schedule.meals_per_delivery,
        quantity: 1,
        status: 'pending',
        stripe_invoice_id: invoice.id,
        customer_email: customerEmail,
      };
    });

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
        // F9-1: 継承後の日付があればそれを next_delivery_date に
        next_delivery_date: inheritedScheduledDate ?? deliverySchedules[0]?.scheduled_date.toISOString().split('T')[0] ?? null,
        payment_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', (dbSubscription as any).id);

    if (updateError) {
      console.error('Failed to update subscription period:', updateError);
    }

    // 在庫を減算（1セット=6食換算: sub-6=1セット, sub-12=2セット）
    const planConfig = getPlanConfig(planId);
    const setsToReduce = Math.max(1, Math.floor(planConfig.meals_per_delivery / 6));
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

    // share-link(個別メッセージ) 経由のコンバージョン記録（継続）
    // shareSlug は subscription metadata に無いので、初回 conversion から引いてくる
    await recordShareLinkConversion({
      sourceType: 'subscription_recurring',
      sourceId: (dbSubscription as any).id,
      stripeInvoiceId: invoice.id,
      planId,
    });

    console.log(`Monthly payment processed for subscription: ${(dbSubscription as any).id}`);

    // Slack通知（月次更新）
    const startDate = new Date((dbSubscription as any).started_at);
    const periodStart = new Date(invoice.period_start * 1000);
    const monthNumber =
      (periodStart.getFullYear() - startDate.getFullYear()) * 12 +
      (periodStart.getMonth() - startDate.getMonth()) + 1;

    await sendSubscriptionRenewalSlackNotification({
      customerName: (dbSubscription as any).shipping_address?.name || 'お客様',
      customerEmail: (dbSubscription as any).shipping_address?.email || '',
      planName: (dbSubscription as any).plan_name,
      monthNumber,
      monthlyAmount: invoice.amount_paid,
    });

    // 更新メール通知
    await sendSubscriptionRenewalEmail({
      email: (dbSubscription as any).shipping_address?.email || '',
      name: (dbSubscription as any).shipping_address?.name || 'お客様',
      planName: (dbSubscription as any).plan_name,
      monthNumber,
      monthlyAmount: invoice.amount_paid,
    });

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

    if (status === 'canceled') {
      const { data: dbSubscription } = await (supabase
        .from('subscriptions') as any)
        .select('id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (dbSubscription) {
        const { error: deliveryError } = await (supabase
          .from('subscription_deliveries') as any)
          .update({ status: 'cancelled' })
          .eq('subscription_id', (dbSubscription as any).id)
          .eq('status', 'pending');

        if (deliveryError) {
          console.error('[Webhook] Failed to cancel pending deliveries on update:', deliveryError);
        } else {
          console.log(`[Webhook] Pending deliveries cancelled for subscription ${subscription.id} (canceled via update)`);
        }
      }
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

  const stripeSubscriptionId = getInvoiceSubscriptionId(invoice) as string;
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
/**
 * B2: 削除されたサブスクが「決済未完了の失効」かを判定する。
 *
 * incomplete_expired は、初回 invoice の支払いが約23時間確認されず Stripe が自動で
 * サブスクを削除した状態。この場合は一度も課金されておらず「解約」ではないため、
 * 解約メールを送ってはいけない。
 *
 * subscription.status が 'incomplete' / 'incomplete_expired' のいずれかなら
 * 「一度も決済成功していない」とみなせる（active を経たことがない）。
 */
function isPaymentIncompleteExpiry(subscription: Stripe.Subscription): boolean {
  return (
    subscription.status === 'incomplete_expired' ||
    subscription.status === 'incomplete'
  );
}

/**
 * B2: 決済未完了で失効したサブスクの処理。
 * - 解約メールは送らない。
 * - お客様には「決済が完了せず失効した」案内（再申込の案内）を送る。
 * - 管理者にも通知する。
 */
async function handleIncompletePaymentExpiry(
  subscription: Stripe.Subscription,
  _stripe: Stripe
) {
  const supabase = getSupabaseClient();

  // メタデータ（activate-subscription が書き込んだ顧客情報）から宛先を取得。
  const meta = subscription.metadata || {};
  let email = meta.email || '';
  let name = meta.customer_name || 'お客様';
  let planName = '';

  // DB 側に契約レコードがあれば、宛先・プラン名を補完しつつ状態を失効に更新。
  if (supabase) {
    try {
      const { data: dbSubscription } = await (supabase
        .from('subscriptions') as any)
        .select('id, plan_name, shipping_address')
        .eq('stripe_subscription_id', subscription.id)
        .maybeSingle();

      if (dbSubscription) {
        planName = (dbSubscription as any).plan_name || planName;
        const shippingAddress = (dbSubscription as any).shipping_address as any;
        if (shippingAddress?.email) email = email || shippingAddress.email;
        if (shippingAddress?.name) name = shippingAddress.name || name;

        // 解約ではなく「決済未完了の失効」として記録する。
        await (supabase.from('subscriptions') as any)
          .update({
            status: 'incomplete_expired',
            payment_status: 'incomplete_expired',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // pending 配送はキャンセルしておく。
        await (supabase.from('subscription_deliveries') as any)
          .update({ status: 'cancelled' })
          .eq('subscription_id', (dbSubscription as any).id)
          .eq('status', 'pending');
      }
    } catch (error) {
      console.error('[incomplete-expiry] DB update error:', error);
    }
  }

  if (!planName) planName = 'ふとるめし定期プラン';

  console.log(`[incomplete-expiry] Subscription ${subscription.id} expired before payment (status=${subscription.status}). Skipping cancellation email.`);

  // お客様向け「決済未完了」案内
  if (email) {
    await sendPaymentIncompleteEmail({ email, name, planName });
  }

  // 管理者向け通知
  await sendAdminIncompleteExpiryNotice({
    subscriptionId: subscription.id,
    customerEmail: email || '(不明)',
    customerName: name,
    planName,
    status: subscription.status,
  });
}

/**
 * B2: お客様向け「決済が完了せず失効した」案内メール（再申込の案内）。
 */
async function sendPaymentIncompleteEmail(params: {
  email: string;
  name: string;
  planName: string;
}) {
  const resend = await getResendClient();
  if (!resend) {
    console.log('Resend client not available, skipping payment-incomplete email');
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.futorumeshi.com';

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #fff; padding: 30px; }
    .button { display: inline-block; background: #E8593C; color: #fff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${params.name}様</p>
      <p>このたびは「${params.planName}」へのお申し込みをいただき、誠にありがとうございます。</p>
      <p>恐れ入りますが、初回のお支払いが完了しなかったため、お申し込みが自動的に失効いたしました。<br>
      なお、ご請求は発生しておりませんのでご安心ください。</p>
      <p>引き続きご利用をご希望の場合は、お手数ですが下記より改めてお申し込みをお願いいたします。</p>
      <p style="text-align:center; margin:24px 0;">
        <a class="button" href="${siteUrl}">お申し込みはこちら</a>
      </p>
      <p>ご不明な点がございましたら、お気軽にご連絡ください。</p>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || '';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: '【ふとるめし】お申し込みの決済が完了しませんでした',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send payment-incomplete email:', error);
  } else {
    console.log('Payment-incomplete email sent to:', params.email);
  }
}

/**
 * B2: 管理者向け「決済未完了で失効」通知。
 * ADMIN_NOTIFICATION_EMAIL が無ければ RESEND_FROM_EMAIL 宛にフォールバック。
 */
async function sendAdminIncompleteExpiryNotice(params: {
  subscriptionId: string;
  customerEmail: string;
  customerName: string;
  planName: string;
  status: string;
}) {
  const resend = await getResendClient();
  const fromEmail = process.env.RESEND_FROM_EMAIL || '';
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || fromEmail;

  if (!resend || !adminEmail) {
    console.log(`[admin-notice] Resend/admin email not available. Subscription ${params.subscriptionId} expired before payment.`);
    return;
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <p>定期申込が初回決済未完了で失効しました（解約メールは送信していません）。</p>
  <ul>
    <li>Stripe Subscription ID: ${params.subscriptionId}</li>
    <li>ステータス: ${params.status}</li>
    <li>お客様: ${params.customerName}（${params.customerEmail}）</li>
    <li>プラン: ${params.planName}</li>
  </ul>
  <p>お客様には「決済未完了・再申込のご案内」を送信済みです。必要に応じてフォローをお願いします。</p>
</body>
</html>
  `;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: '【管理通知】定期申込が初回決済未完了で失効しました',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send admin incomplete-expiry notice:', error);
  } else {
    console.log('Admin incomplete-expiry notice sent for:', params.subscriptionId);
  }
}

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
      .select('id, plan_name, shipping_address')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (dbSubscription) {
      await (supabase
        .from('subscription_deliveries') as any)
        .update({ status: 'cancelled' })
        .eq('subscription_id', (dbSubscription as any).id)
        .eq('status', 'pending');

      // 解約通知メールを送信
      const shippingAddress = (dbSubscription as any).shipping_address as any;
      if (shippingAddress?.email) {
        await sendSubscriptionCancellationEmail({
          email: shippingAddress.email,
          name: shippingAddress.name || 'お客様',
          planName: (dbSubscription as any).plan_name || 'ふとるめし定期プラン',
        });
      }
    }

    console.log(`Subscription ${subscription.id} canceled`);

  } catch (error) {
    console.error('Error canceling subscription:', error);
  }
}

// 解約通知メール送信
async function sendSubscriptionCancellationEmail(params: {
  email: string;
  name: string;
  planName: string;
}) {
  const resend = await getResendClient();
  if (!resend) {
    console.log('Resend client not available, skipping cancellation email');
    return;
  }

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
      <p>「${params.planName}」の解約手続きが完了いたしました。</p>
      <p>これまでのご利用、誠にありがとうございました。</p>
      <p>またのご利用を心よりお待ちしております。</p>
      <p>ご不明な点がございましたらお気軽にご連絡ください。</p>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || '';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: '【ふとるめし】定期プランの解約が完了しました',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send subscription cancellation email:', error);
  } else {
    console.log('Subscription cancellation email sent to:', params.email);
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
        <p>ご注文確認後、順次配送いたします。</p>
      </div>

      <p>ご不明な点がございましたらご連絡ください。</p>

      <div class="footer">
        <p style="margin: 0;">LandBridge株式会社</p>
        <p style="margin: 5px 0;"><a href="mailto:${process.env.MAIL_CONTACT_EMAIL || ''}">${process.env.MAIL_CONTACT_EMAIL || ''}</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || '';

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

  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);

  const itemsList = items
    .map(item => `• ${item.description} × ${item.quantity}`)
    .join('\n');

  await postSlack('sales', [
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
  ]);
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
    <div style="text-align: center; padding: 20px 0 10px;">
      <img src="https://futorumeshi.com/images/branding/mail-icon.png" alt="ふとるめし" width="80" height="80" style="border-radius: 50%;">
    </div>
    <div class="content">
      <p>${params.name}様</p>
      <p>この度は「ふとるめし」定期プランをご購入いただき、誠にありがとうございます。</p>
      
      <div class="delivery-schedule">
        <p style="margin-top: 0;"><strong>${params.planName}</strong></p>
        <p>月額料金: ${formatCurrency(params.monthlyAmount)}</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 15px 0;">
        <p><strong>配送について</strong></p>
        <p>ご注文確認後、順次配送いたします。</p>
      </div>

      <p>毎月自動で課金・配送されます。解約をご希望の場合はマイページからお申し出ください。</p>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin-top: 0; font-weight: bold; color: #1e40af;">🔑 会員登録が完了しました</p>
        <p style="color: #1e40af; font-size: 14px;">
          ご購入時に会員アカウントが自動作成されました。
        </p>
        <p style="color: #374151; font-size: 14px; margin-bottom: 5px;">
          <strong>メールアドレス:</strong> ${params.email}
        </p>
        <p style="color: #374151; font-size: 14px;">
          <strong>パスワード:</strong> ご購入時に設定したパスワードをご利用ください
        </p>
        <p style="color: #6b7280; font-size: 13px; margin-top: 15px;">
          マイページではご注文履歴やサブスクリプションの管理ができます。
        </p>
        <a href="https://www.futorumeshi.com/mypage" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 10px;">
          マイページへログイン
        </a>
      </div>

      <p>ご不明な点がございましたらご連絡ください。</p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
        <p style="margin: 0; font-size: 14px;">LandBridge株式会社</p>
        <p style="margin: 5px 0; font-size: 14px;"><a href="mailto:sales@landbridge.co.jp">sales@landbridge.co.jp</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || '';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: '【ふとるめし】定期プランのご購入・会員登録が完了しました',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send subscription purchase confirmation email:', error);
  } else {
    console.log(`[Webhook] Subscription purchase email sent to: ${params.email}`);
  }
}

// サブスクリプション更新メール
async function sendSubscriptionRenewalEmail(params: {
  email: string;
  name: string;
  planName: string;
  monthNumber: number;
  monthlyAmount: number;
}) {
  const resend = await getResendClient();
  if (!resend) return;

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
    .plan-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center; padding: 20px 0 10px;">
      <img src="https://futorumeshi.com/images/branding/mail-icon.png" alt="ふとるめし" width="80" height="80" style="border-radius: 50%;">
    </div>
    <div class="content">
      <p>${params.name}様</p>
      <p>いつも「ふとるめし」をご利用いただき、ありがとうございます。<br>
      ${params.monthNumber}ヶ月目の自動課金が完了しました。</p>

      <div class="plan-details">
        <p style="margin-top: 0; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; margin-bottom: 10px;">
          <strong>${params.planName}</strong>
        </p>
        <p style="margin: 0;">今月の請求金額: <strong>${formatCurrency(params.monthlyAmount)}</strong></p>
      </div>

      <p>引き続き毎月自動で課金・配送いたします。<br>
      解約をご希望の場合は、マイページよりお手続きください。</p>
      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || '';

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: `【ふとるめし】${params.monthNumber}ヶ月目の課金・配送のお知らせ`,
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send subscription renewal email:', error);
  } else {
    console.log(`[Webhook] Subscription renewal email sent to: ${params.email}`);
  }
}

// サブスクリプションSlack通知
async function sendSubscriptionSlackNotification(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  monthlyAmount: number;
}) {
  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(params.monthlyAmount);

  await postSlack('sales', [
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
  ]);
}

// サブスクリプション更新Slack通知
async function sendSubscriptionRenewalSlackNotification(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  monthNumber: number;
  monthlyAmount: number;
}) {
  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(params.monthlyAmount);

  await postSlack('sales', [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🔄 サブスクリプション更新', emoji: true },
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
        { type: 'mrkdwn', text: `*ヶ月目:*\n${params.monthNumber}ヶ月目` },
      ],
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*今月の請求:*\n${formattedAmount}` },
      ],
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        { type: 'mrkdwn', text: `📅 ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}` },
      ],
    },
  ]);
}

// 支払い失敗メール
async function sendPaymentFailedEmail(params: {
  email: string;
  name: string;
  planName: string;
}) {
  const resend = await getResendClient();
  if (!resend) return;

  // F40: マイページ経由でお支払い情報を更新できるリンクを案内。
  // env (NEXT_PUBLIC_SITE_URL) 優先、未設定時は本番URLにフォールバック。
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.futorumeshi.com';
  const mypageUrl = `${siteUrl}/mypage`;

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
    .cta { text-align: center; margin: 24px 0; }
    .cta a { display: inline-block; background: #dc2626; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    .cta a:hover { background: #b91c1c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${params.name}様</p>
      <div class="warning">
        <p style="margin-top: 0; color: #dc2626;"><strong>お支払いに問題が発生しました</strong></p>
        <p>「${params.planName}」の月額料金のお支払いが完了しませんでした。</p>
        <p>お手数ですが、マイページからお支払い情報（カード情報）をご確認・更新ください。</p>
      </div>
      <div class="cta">
        <a href="${mypageUrl}">マイページでお支払い情報を変更する</a>
      </div>
      <p style="font-size: 12px; color: #666;">ボタンが表示されない場合は、以下のURLをブラウザにコピー＆ペーストしてください。<br>${mypageUrl}</p>
      <p>お支払いが確認できない場合、サブスクリプションが一時停止される場合があります。</p>
      <p>ご不明な点がございましたらご連絡ください。</p>
    </div>
  </div>
</body>
</html>
  `;

  const fromEmail = process.env.RESEND_FROM_EMAIL || '';

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
