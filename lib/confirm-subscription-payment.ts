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
 * invoice / confirmation_secret から PaymentIntent の id を取り出す。
 * SDK v20（basil世代）では `latest_invoice.payment_intent` が展開されず空になるため、
 * `invoice.payment_intent`（あれば）→ なければ `confirmation_secret.client_secret` を
 * `'_secret_'` で分割した先頭（= PI id）から解決する。
 */
function extractPaymentIntentId(invoice: Stripe.Invoice): string | null {
  const withPi = invoice as Stripe.Invoice & {
    payment_intent?: Stripe.PaymentIntent | string | null;
  };
  const pi = withPi.payment_intent;
  if (pi) {
    if (typeof pi === 'string') return pi;
    if (pi.id) return pi.id;
  }
  const secret = invoice.confirmation_secret?.client_secret;
  if (secret && secret.includes('_secret_')) {
    const piId = secret.split('_secret_')[0];
    if (piId.startsWith('pi_')) return piId;
  }
  return null;
}

/**
 * 初回 PaymentIntent を確実に解決してから確定する。
 * subscription は `expand: ['latest_invoice.payment_intent']` で作成済みであること。
 * ただし SDK v20 では展開されないため、invoice 再取得 / confirmation_secret からも解決する。
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

  // a. latest_invoice の invoice id を解決する。
  const latestInvoice = subscription.latest_invoice as Stripe.Invoice | string | null;
  let invoice: Stripe.Invoice | null = null;
  let invoiceId: string | null = null;

  if (latestInvoice && typeof latestInvoice === 'object') {
    invoice = latestInvoice;
    invoiceId = latestInvoice.id ?? null;
  } else if (typeof latestInvoice === 'string') {
    invoiceId = latestInvoice;
  }

  if (!invoiceId) {
    // 請求書が無い（請求額0など） → 確定不要とみなす。
    console.log(`[confirm-sub-payment] no invoice id for ${subscription.id}, status=${subscription.status}`);
    return { requiresAction: false, subscriptionStatus: subscription.status };
  }

  // latest_invoice が object でない / PI も confirmation_secret も無い場合は invoice を再取得して
  // confirmation_secret / payment_intent を展開する。
  if (!invoice || (!extractPaymentIntentId(invoice))) {
    try {
      invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ['confirmation_secret', 'payment_intent'],
      });
    } catch (e) {
      console.error(`[confirm-sub-payment] invoice retrieve failed for ${invoiceId}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (!invoice) {
    return { requiresAction: false, subscriptionStatus: subscription.status };
  }

  // 請求残が無い（amount_due=0 / paid 済み）なら確定不要。
  const hasOutstanding = invoice.amount_due > 0 || invoice.status === 'open';
  const piId = extractPaymentIntentId(invoice);
  console.log(`[confirm-sub-payment] sub=${subscription.id} invoice=${invoiceId} status=${invoice.status} amount_due=${invoice.amount_due} piId=${piId ?? 'none'}`);

  if (!hasOutstanding) {
    // 請求額0（クーポン全額割引等で即 paid）→ 確定不要。
    return { requiresAction: false, subscriptionStatus: subscription.status };
  }

  // c. PI が解決できた場合は PI を取得して確定フローに流す。
  if (piId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(piId);

      if (paymentIntent.status === 'succeeded') {
        console.log(`[confirm-sub-payment] PI ${piId} already succeeded`);
        return { requiresAction: false, subscriptionStatus: 'active' };
      }

      if (paymentIntent.status === 'requires_action') {
        console.log(`[confirm-sub-payment] PI ${piId} requires_action → defer to frontend`);
        return {
          requiresAction: true,
          clientSecret: paymentIntent.client_secret,
          subscriptionStatus: subscription.status,
        };
      }

      // requires_confirmation / requires_payment_method → off_session で確定を試みる。
      const confirmed = await stripe.paymentIntents.confirm(piId, {
        payment_method: paymentMethodId,
        off_session: true,
      });
      console.log(`[confirm-sub-payment] PI ${piId} confirm result=${confirmed.status}`);

      if (confirmed.status === 'succeeded') {
        return { requiresAction: false, subscriptionStatus: 'active' };
      }

      if (confirmed.status === 'requires_action') {
        return {
          requiresAction: true,
          clientSecret: confirmed.client_secret,
          subscriptionStatus: subscription.status,
        };
      }

      return { requiresAction: false, error: `payment_intent status: ${confirmed.status}` };
    } catch (err) {
      // off_session 確定で 3DS 等の認証が要求されると StripeCardError が投げられる。
      const stripeErr = err as Stripe.errors.StripeError;
      const pi = (stripeErr as { payment_intent?: Stripe.PaymentIntent }).payment_intent;
      if (pi && pi.status === 'requires_action') {
        console.log(`[confirm-sub-payment] PI ${piId} confirm threw requires_action → defer to frontend`);
        return {
          requiresAction: true,
          clientSecret: pi.client_secret,
          subscriptionStatus: subscription.status,
        };
      }
      console.error(`[confirm-sub-payment] PI ${piId} confirm error: ${stripeErr.message || String(err)}`);
      return { requiresAction: false, error: stripeErr.message || String(err) };
    }
  }

  // PI を解決できないが請求残がある → invoice.pay でフォールバック確定する。
  // 無言で requiresAction:false を返さない（money-critical）。
  console.log(`[confirm-sub-payment] PI unresolved but outstanding → fallback invoices.pay ${invoiceId}`);
  try {
    const paid = await stripe.invoices.pay(invoiceId, {
      payment_method: paymentMethodId,
      off_session: true,
    });
    console.log(`[confirm-sub-payment] invoices.pay ${invoiceId} result status=${paid.status}`);
    if (paid.status === 'paid') {
      return { requiresAction: false, subscriptionStatus: 'active' };
    }
    return { requiresAction: false, error: `invoice status after pay: ${paid.status}` };
  } catch (err) {
    const stripeErr = err as Stripe.errors.StripeError;
    const pi = (stripeErr as { payment_intent?: Stripe.PaymentIntent }).payment_intent;
    if (pi && pi.status === 'requires_action') {
      console.log(`[confirm-sub-payment] invoices.pay ${invoiceId} threw requires_action → defer to frontend`);
      return {
        requiresAction: true,
        clientSecret: pi.client_secret,
        subscriptionStatus: subscription.status,
      };
    }
    console.error(`[confirm-sub-payment] invoices.pay ${invoiceId} error: ${stripeErr.message || String(err)}`);
    return { requiresAction: false, error: stripeErr.message || String(err) };
  }
}
