/**
 * Stripe API バージョン 2024-09-30 以降で invoice.subscription が
 * invoice.parent.subscription_details.subscription に移動したことに気付かず、
 * webhook の invoice.payment_succeeded ハンドラがスキップされていた期間に
 * 取りこぼした「月次更新の deliveries 作成 + Slack 更新通知 + 更新メール」を補完する。
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
} from '@/lib/subscription-schedule';

export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const fromParent = (invoice as any).parent?.subscription_details?.subscription;
  const fromLegacy = (invoice as any).subscription;
  const sub = fromParent || fromLegacy;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

async function sendBackfillRenewalSlack(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  monthNumber: number;
  monthlyAmount: number;
  billingDate: Date;
}) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) return { ok: false, reason: 'SLACK_WEBHOOK_URL not set' };

  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(params.monthlyAmount);

  const message = {
    blocks: [
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
            text: `📅 請求日: ${params.billingDate.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}（webhook取りこぼし分の補完通知）`,
          },
        ],
      },
      { type: 'divider' },
    ],
  };

  const res = await fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  return { ok: res.ok, status: res.status };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
  const supabase = createServerClient();

  // active なサブスクのみ対象
  const { data: subs, error: fetchError } = await (supabase
    .from('subscriptions') as any)
    .select('id, stripe_subscription_id, stripe_customer_id, plan_id, plan_name, started_at, shipping_address')
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

      // Stripe から subscription_cycle invoice を取得（line items 含む）
      const invoices = await stripe.invoices.list({
        customer: sub.stripe_customer_id,
        limit: 100,
        expand: ['data.lines'],
      });

      const cycleInvoices = invoices.data.filter(
        (inv) =>
          inv.billing_reason === 'subscription_cycle' &&
          getInvoiceSubscriptionId(inv) === sub.stripe_subscription_id &&
          inv.status === 'paid'
      );

      // 既存の deliveries を取得（subscription_id で）
      const { data: existingDeliveries } = await (supabase
        .from('subscription_deliveries') as any)
        .select('scheduled_date, stripe_invoice_id')
        .eq('subscription_id', sub.id);

      const existingInvoiceIds = new Set(
        (existingDeliveries || [])
          .map((d: any) => d.stripe_invoice_id)
          .filter((id: any) => !!id)
      );
      const existingDates = new Set(
        (existingDeliveries || []).map((d: any) => d.scheduled_date)
      );

      // 各 cycle invoice について、対応する delivery が無ければ補完
      for (const inv of cycleInvoices) {
        const invoiceId = inv.id;
        // Stripe Invoice の period_start/end は「直前の使用期間」を指す。
        // 実際の請求対象（次のサイクル）は line item の period に入っている。
        // 商品 line item を優先（送料 line item は除外）。
        const productLine = inv.lines?.data?.find((l: any) => {
          const planNickname = (l as any).plan?.nickname || '';
          // 送料 price を除外（"無料"や"送料"を含む nickname）
          return !planNickname.includes('送料') && !planNickname.includes('無料');
        }) || inv.lines?.data?.[0];

        const linePeriodStart = (productLine as any)?.period?.start as number;
        const billingPeriodStart = linePeriodStart || (inv as any).period_end || inv.created;

        // 既にこの invoice 由来の delivery がある場合はスキップ
        if (invoiceId && existingInvoiceIds.has(invoiceId)) {
          continue;
        }

        const billingDate = new Date(billingPeriodStart * 1000);
        const billingDateStr = billingDate.toISOString().split('T')[0];

        // scheduled_date で重複チェック（前回のcreate前は invoice_id 未設定の可能性）
        if (existingDates.has(billingDateStr)) {
          continue;
        }

        const schedules = calculateMonthlyDeliverySchedule(planId, billingDate);
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

        // 月数（経過月数）を計算
        const startedAt = new Date(sub.started_at);
        const monthNumber =
          (billingDate.getFullYear() - startedAt.getFullYear()) * 12 +
          (billingDate.getMonth() - startedAt.getMonth()) + 1;

        const cycleAction: any = {
          invoice_id: invoiceId,
          billing_reason: inv.billing_reason,
          billing_date: billingDateStr,
          amount_paid: inv.amount_paid,
          month_number: monthNumber,
          deliveries_to_create: deliveryRows.map((r) => ({
            scheduled_date: r.scheduled_date,
            menu_set: r.menu_set,
          })),
        };

        if (!dryRun) {
          // deliveries 一括作成
          const { error: insertError } = await (supabase
            .from('subscription_deliveries') as any)
            .insert(deliveryRows);
          if (insertError) {
            cycleAction.insert_error = insertError.message;
          } else {
            cycleAction.inserted = deliveryRows.length;
          }

          // Slack 更新通知
          if (sub.shipping_address?.email && sub.shipping_address?.name) {
            const slackResult = await sendBackfillRenewalSlack({
              customerName: sub.shipping_address.name,
              customerEmail: sub.shipping_address.email,
              planName: sub.plan_name,
              monthNumber,
              monthlyAmount: inv.amount_paid,
              billingDate,
            });
            cycleAction.slack = slackResult;
          } else {
            cycleAction.slack = { ok: false, reason: 'missing email/name in shipping_address' };
          }
        }

        subResult.actions.push(cycleAction);
        subResult.missed_cycles.push(billingDateStr);
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
