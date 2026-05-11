/**
 * Stripe API バージョン 2024-09-30 以降で invoice.subscription が
 * invoice.parent.subscription_details.subscription に移動したことに気付かず、
 * webhook の invoice.payment_succeeded ハンドラがスキップされていた期間に
 * 取りこぼした「月次更新の deliveries 作成 + Slack 更新通知 + 更新メール」を補完する。
 *
 * アプローチ: Stripe Subscription の billing_cycle_anchor から月次サイクルを
 * 直接生成し、各サイクル日について subscription_deliveries に対応行が無ければ補完する。
 *
 * 認証: Authorization: Bearer ${CRON_SECRET}
 * ?dryRun=1 で副作用なしのプレビュー
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import Stripe from 'stripe';
import {
  calculateMonthlyDeliverySchedule,
  getMenuSetNameWithDeliveryNumber,
  isValidPlanId,
  getPlanConfig,
} from '@/lib/subscription-schedule';
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

// 同じ日（年月日）のN月後を返す（月末日対応：例 1/31 + 1month → 2/28 or 2/29）
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  // setMonth でズレた場合（例: 1/31 → 3/3）は月末日に戻す
  if (d.getMonth() !== ((targetMonth % 12) + 12) % 12) {
    d.setDate(0);
  }
  return d;
}

async function sendBackfillRenewalSlack(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  monthNumber: number;
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
      text: { type: 'plain_text', text: '🔄 サブスクリプション更新（再送）', emoji: true },
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
      fields: [{ type: 'mrkdwn', text: `*今月の請求:*\n${formattedAmount}` }],
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

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
  const supabase = createServerClient();

  const { data: subs, error: fetchError } = await (supabase
    .from('subscriptions') as any)
    .select('id, stripe_subscription_id, stripe_customer_id, plan_id, plan_name, started_at, shipping_address')
    .eq('status', 'active');

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions', details: fetchError.message }, { status: 500 });
  }

  const results: any[] = [];
  const now = new Date();

  for (const sub of subs || []) {
    const subResult: any = {
      id: sub.id,
      stripe_subscription_id: sub.stripe_subscription_id,
      customer: sub.shipping_address?.name,
      missed_cycles: [],
      actions: [],
    };

    try {
      const planId = sub.plan_id;
      if (!planId || !isValidPlanId(planId)) {
        subResult.error = `Invalid plan_id: ${planId}`;
        results.push(subResult);
        continue;
      }
      const planConfig = getPlanConfig(planId);

      // Stripe Subscription を取得して billing_cycle_anchor を得る
      const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const anchor = (stripeSubscription as any).billing_cycle_anchor as number;
      if (!anchor) {
        subResult.error = 'No billing_cycle_anchor on Stripe subscription';
        results.push(subResult);
        continue;
      }
      const anchorDate = new Date(anchor * 1000);

      // 既存の deliveries
      const { data: existingDeliveries } = await (supabase
        .from('subscription_deliveries') as any)
        .select('scheduled_date, stripe_invoice_id')
        .eq('subscription_id', sub.id);

      const existingDates = new Set(
        (existingDeliveries || []).map((d: any) => d.scheduled_date)
      );

      // Stripe invoices をまとめて取得（請求金額参照用）
      const invoices = await stripe.invoices.list({
        customer: sub.stripe_customer_id,
        limit: 100,
      });
      const cycleInvoices = invoices.data.filter(
        (inv) =>
          inv.billing_reason === 'subscription_cycle' &&
          getInvoiceSubscriptionId(inv) === sub.stripe_subscription_id &&
          inv.status === 'paid'
      );

      // anchor + 1ヶ月から today までの月次サイクルを走査
      for (let m = 1; ; m++) {
        const cycleStart = addMonths(anchorDate, m);
        if (cycleStart > now) break;
        const cycleStartStr = cycleStart.toISOString().split('T')[0];

        // 既に delivery がある場合はスキップ
        if (existingDates.has(cycleStartStr)) {
          continue;
        }

        // 該当月の cycle invoice を探す（同月のものを優先）
        const matchedInvoice = cycleInvoices.find((inv) => {
          // invoice.created がこの cycleStart の前 7 日 〜 後 30 日の範囲内
          const created = new Date(inv.created * 1000);
          const diffDays = (created.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays >= -7 && diffDays <= 30;
        });

        const amountPaid = matchedInvoice?.amount_paid ?? planConfig.monthly_total;
        const invoiceId = matchedInvoice?.id ?? null;

        const schedules = calculateMonthlyDeliverySchedule(planId, cycleStart);
        const deliveryRows = schedules.map((s) => ({
          subscription_id: sub.id,
          scheduled_date: s.scheduled_date.toISOString().split('T')[0],
          menu_set: getMenuSetNameWithDeliveryNumber(planId, s.delivery_number),
          meals_per_delivery: s.meals_per_delivery,
          quantity: 1,
          status: 'pending',
          stripe_invoice_id: invoiceId,
          customer_email: sub.shipping_address?.email || '',
        }));

        const cycleAction: any = {
          month_number: m + 1, // 1ヶ月目=初月→ m=1 が 2ヶ月目
          cycle_start: cycleStartStr,
          invoice_id: invoiceId,
          amount_paid: amountPaid,
          deliveries_to_create: deliveryRows.map((r) => ({
            scheduled_date: r.scheduled_date,
            menu_set: r.menu_set,
          })),
        };

        if (!dryRun) {
          const { error: insertError } = await (supabase
            .from('subscription_deliveries') as any)
            .insert(deliveryRows);
          if (insertError) {
            cycleAction.insert_error = insertError.message;
          } else {
            cycleAction.inserted = deliveryRows.length;
          }

          if (sub.shipping_address?.email && sub.shipping_address?.name) {
            const slackResult = await sendBackfillRenewalSlack({
              customerName: sub.shipping_address.name,
              customerEmail: sub.shipping_address.email,
              planName: sub.plan_name,
              monthNumber: m + 1,
              monthlyAmount: amountPaid,
              billingDate: cycleStart,
            });
            cycleAction.slack = slackResult;
          } else {
            cycleAction.slack = { ok: false, reason: 'missing email/name in shipping_address' };
          }
        }

        subResult.actions.push(cycleAction);
        subResult.missed_cycles.push(cycleStartStr);
      }
    } catch (err: any) {
      subResult.error = err.message || String(err);
    }

    if (subResult.actions.length > 0 || subResult.error) {
      results.push(subResult);
    }
  }

  return NextResponse.json({
    dryRun,
    affected_subscriptions: results.length,
    results,
  });
}
