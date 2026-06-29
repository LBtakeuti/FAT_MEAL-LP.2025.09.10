/**
 * 定期更新配送の「取りこぼし防止」恒久的な安全網（日次バッチ）。
 *
 * Stripe で定期更新の課金（billing_reason='subscription_cycle' / status='paid'）が成立したのに、
 * webhook 取りこぼし等で subscription_deliveries が作られなかったケースを毎日検知して補完する。
 * （ten.nari 等の旧プラン契約で過去に取りこぼした実績があるため恒久運用とする）
 *
 * 【二重作成しない設計】
 * 1. 取りこぼし判定は scheduled_date（=請求日）ではなく stripe_invoice_id 単位で行う。
 *    F9-1 以降、更新の配送日は「希望日」で請求日とズレるため、日付一致での判定は誤検知する。
 * 2. 作成する配送日は webhook（handleMonthlySubscriptionPayment）と同一ロジックで計算する：
 *    - billingDate = invoice.lines.data[0].period.start（その請求サイクルの開始日）
 *    - preferred_delivery_date があれば inheritPreferredDateForBilling、無ければ
 *      calculateMonthlyDeliverySchedule の billingDate ベース。
 *    これにより webhook が作る値と完全一致し、二重作成と過去日化を同時に防ぐ。
 *
 * 認証: Authorization: Bearer ${CRON_SECRET}
 * ?dryRun=1 で副作用なしのプレビュー（GET / POST どちらでも尊重）
 * GET = Vercel Cron 用 / POST = 手動実行用（内部で同一処理本体を呼ぶ）
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import Stripe from 'stripe';
import { isValidPlanId, getPlanConfig } from '@/lib/subscription-schedule';
import {
  buildMissedRenewals,
  type CycleInvoiceInput,
} from '@/lib/safety-net-renewal-deliveries';
import { postSlack } from '@/lib/slack';

export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const fromParent = (invoice as any).parent?.subscription_details?.subscription;
  const fromLegacy = (invoice as any).subscription;
  const sub = fromParent || fromLegacy;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

/** その請求サイクルの開始日（unix 秒）。webhook と同じく invoice.lines.data[0].period.start を使う */
function getInvoicePeriodStartUnix(invoice: Stripe.Invoice): number | null {
  const fromLine = (invoice as any).lines?.data?.[0]?.period?.start;
  if (typeof fromLine === 'number') return fromLine;
  // フォールバック: invoice.period_start（lines が展開されていない場合）
  if (typeof invoice.period_start === 'number') return invoice.period_start;
  return null;
}

async function sendBackfillRenewalSlack(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  monthlyAmount: number;
  billingDate: Date;
}) {
  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(params.monthlyAmount);

  return postSlack('alert', [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🔄 サブスクリプション更新（安全網で補完）', emoji: true },
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
        { type: 'mrkdwn', text: `*今月の請求:*\n${formattedAmount}` },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📅 請求日: ${params.billingDate.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}（webhook取りこぼし分の補完通知）`,
        },
      ],
    },
    { type: 'divider' },
  ]);
}

/** GET / POST 共通の処理本体 */
async function runSafetyNet(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
  const supabase = createServerClient();

  const { data: subs, error: fetchError } = await (supabase
    .from('subscriptions') as any)
    .select('id, stripe_subscription_id, stripe_customer_id, plan_id, plan_name, started_at, preferred_delivery_date, shipping_address')
    .eq('status', 'active');

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions', details: fetchError.message }, { status: 500 });
  }

  const results: any[] = [];

  for (const sub of subs || []) {
    const subResult: any = {
      id: sub.id,
      stripe_subscription_id: sub.stripe_subscription_id,
      customer: sub.shipping_address?.name,
      created: [],
    };

    try {
      const planId = sub.plan_id;
      if (!planId || !isValidPlanId(planId)) {
        subResult.error = `Invalid plan_id: ${planId}`;
        results.push(subResult);
        continue;
      }
      const planConfig = getPlanConfig(planId);

      // 既存 deliveries の stripe_invoice_id（非 null）集合を作る
      const { data: existingDeliveries } = await (supabase
        .from('subscription_deliveries') as any)
        .select('stripe_invoice_id')
        .eq('subscription_id', sub.id);

      const existingInvoiceIds = new Set<string>(
        (existingDeliveries || [])
          .map((d: any) => d.stripe_invoice_id)
          .filter((v: any): v is string => typeof v === 'string' && v.length > 0)
      );

      // Stripe invoices をまとめて取得
      const invoiceList = await stripe.invoices.list({
        customer: sub.stripe_customer_id,
        limit: 100,
      });

      const invoiceInputs: CycleInvoiceInput[] = invoiceList.data.map((inv) => ({
        id: inv.id ?? '',
        billingReason: inv.billing_reason ?? null,
        status: inv.status ?? null,
        subscriptionId: getInvoiceSubscriptionId(inv),
        periodStartUnix: getInvoicePeriodStartUnix(inv) ?? 0,
        amountPaid: inv.amount_paid ?? planConfig.monthly_total,
      }));

      const missed = buildMissedRenewals({
        subscriptionDbId: sub.id,
        stripeSubscriptionId: sub.stripe_subscription_id,
        planId,
        preferred: (sub as any).preferred_delivery_date ?? null,
        customerEmail: sub.shipping_address?.email || '',
        invoices: invoiceInputs,
        existingInvoiceIds,
      });

      for (const m of missed) {
        const action: any = {
          invoice_id: m.invoiceId,
          billing_period_start: new Date(m.periodStartUnix * 1000).toISOString().split('T')[0],
          scheduled_date: m.scheduledDate,
          amount_paid: m.amountPaid,
          menu_set: m.row.menu_set,
        };

        if (!dryRun) {
          const { error: insertError } = await (supabase
            .from('subscription_deliveries') as any)
            .insert([m.row]);
          if (insertError) {
            action.insert_error = insertError.message;
          } else {
            action.inserted = true;
          }

          if (sub.shipping_address?.email && sub.shipping_address?.name) {
            const slackResult = await sendBackfillRenewalSlack({
              customerName: sub.shipping_address.name,
              customerEmail: sub.shipping_address.email,
              planName: sub.plan_name,
              monthlyAmount: m.amountPaid,
              billingDate: new Date(m.periodStartUnix * 1000),
            });
            action.slack = slackResult;
          } else {
            action.slack = { ok: false, reason: 'missing email/name in shipping_address' };
          }
        }

        subResult.created.push(action);
      }
    } catch (err: any) {
      subResult.error = err.message || String(err);
    }

    if (subResult.created.length > 0 || subResult.error) {
      results.push(subResult);
    }
  }

  console.log(
    `[safety-net-renewal-deliveries] dryRun=${dryRun} affected=${results.length} created=${results.reduce((acc, r) => acc + (r.created?.length || 0), 0)}`
  );

  return NextResponse.json({
    dryRun,
    affected_subscriptions: results.length,
    results,
  });
}

// Vercel Cron は GET で叩く
export async function GET(request: NextRequest) {
  return runSafetyNet(request);
}

// 手動実行用（既存互換）
export async function POST(request: NextRequest) {
  return runSafetyNet(request);
}
