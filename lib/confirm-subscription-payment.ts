/**
 * B1: 定期契約の初回 invoice の PaymentIntent をサーバ側で確定するヘルパー。
 *
 * 背景:
 *   定期申込は SetupIntent で決済手段を登録 → subscriptions.create() で契約作成する方式。
 *   payment_behavior=default_incomplete で作成した場合、初回 invoice の PaymentIntent は
 *   「確認待ち（requires_confirmation / requires_action）」のまま残り、サーバ側で確定しないと
 *   約23時間後に Stripe 仕様で incomplete_expired となり契約が無言失効してしまう。
 *
 *   このヘルパーは登録済み default_payment_method で off_session 確定を試み、
 *   - succeeded → 確定成功
 *   - requires_action / requires_payment_method → 追加認証が必要（client_secret を返す）
 *   - それ以外の失敗 → error を返す
 *   を呼び出し側に返す。呼び出し側で無言放置せず適切にレスポンスする。
 */
import type Stripe from 'stripe';

export interface ConfirmInitialPaymentResult {
  /** 追加認証（Link/3DS）が必要。フロントで完了させるため client_secret を返す。 */
  requiresAction: boolean;
  /** requiresAction 時のみ。PaymentIntent の client_secret。 */
  clientSecret?: string | null;
  /** 確定に失敗した場合のエラー文言（ログ用）。 */
  error?: string;
  /** 確定後のサブスクリプションステータス（取得できた場合）。 */
  subscriptionStatus?: Stripe.Subscription.Status;
}

/**
 * 初回 PaymentIntent を確定する。
 * subscription は `expand: ['latest_invoice.payment_intent']` で作成済みであること。
 */
export async function confirmInitialSubscriptionPayment(
  stripe: Stripe,
  subscription: Stripe.Subscription,
  paymentMethodId: string
): Promise<ConfirmInitialPaymentResult> {
  // active / trialing なら初回請求は既に確定済み（クーポン100%等で請求額0のケースを含む）。
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    return { requiresAction: false, subscriptionStatus: subscription.status };
  }

  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
  if (!latestInvoice || typeof latestInvoice === 'string') {
    // invoice が展開されていない。安全側で「確定不要（請求なし）」とみなす。
    return { requiresAction: false, subscriptionStatus: subscription.status };
  }

  // 請求額0（クーポン全額割引等）なら PaymentIntent が無く、契約は即 active になる。
  const paymentIntent = (latestInvoice as Stripe.Invoice & {
    payment_intent?: Stripe.PaymentIntent | string | null;
  }).payment_intent;

  if (!paymentIntent || typeof paymentIntent === 'string') {
    return { requiresAction: false, subscriptionStatus: subscription.status };
  }

  try {
    // 既に succeeded ならそのまま成功扱い。
    if (paymentIntent.status === 'succeeded') {
      return { requiresAction: false, subscriptionStatus: subscription.status };
    }

    // 追加認証が必要な状態なら confirm せず client_secret を返す。
    if (paymentIntent.status === 'requires_action') {
      return {
        requiresAction: true,
        clientSecret: paymentIntent.client_secret,
        subscriptionStatus: subscription.status,
      };
    }

    // requires_confirmation / requires_payment_method → off_session で確定を試みる。
    const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: paymentMethodId,
      off_session: true,
    });

    if (confirmed.status === 'succeeded') {
      return { requiresAction: false, subscriptionStatus: 'active' };
    }

    if (confirmed.status === 'requires_action') {
      // off_session では完了できず追加認証が要る → フロントへ委譲。
      return {
        requiresAction: true,
        clientSecret: confirmed.client_secret,
        subscriptionStatus: subscription.status,
      };
    }

    return { requiresAction: false, error: `payment_intent status: ${confirmed.status}` };
  } catch (err) {
    // off_session 確定で 3DS 等の認証が要求されると StripeCardError が投げられる。
    // その場合 payment_intent から client_secret を取り出してフロントへ委譲する。
    const stripeErr = err as Stripe.errors.StripeError;
    const pi = (stripeErr as { payment_intent?: Stripe.PaymentIntent }).payment_intent;
    if (pi && (pi.status === 'requires_action' || pi.status === 'requires_payment_method' || pi.status === 'requires_confirmation')) {
      if (pi.status === 'requires_action') {
        return {
          requiresAction: true,
          clientSecret: pi.client_secret,
          subscriptionStatus: subscription.status,
        };
      }
    }
    return { requiresAction: false, error: stripeErr.message || String(err) };
  }
}
