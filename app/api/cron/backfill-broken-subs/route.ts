/**
 * Stripe Elements 移行（5/1）後に shipping_address が壊れた状態で保存された
 * サブスクリプションを Stripe metadata から再構築 + Slack 再送するワンショットAPI。
 *
 * 認証: Authorization: Bearer ${CRON_SECRET}
 * dryRun: ?dryRun=1 でクエリするとDB更新・Slack送信せずプレビューのみ返す
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import Stripe from 'stripe';
import { postSlack } from '@/lib/slack';

export const maxDuration = 60;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

interface BrokenSub {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_name: string;
  shipping_address: Record<string, string>;
  user_id: string | null;
  monthly_total_amount: number;
  started_at: string;
}

async function sendBackfillSlackNotification(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  monthlyAmount: number;
  startedAt: string;
}) {
  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(params.monthlyAmount);

  return postSlack('alert', [
    {
      type: 'header',
      text: { type: 'plain_text', text: '🎉 新規サブスクリプション契約！（再送）', emoji: true },
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
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `📅 契約日時: ${new Date(params.startedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}（5/1 リリース起因の通知欠落分の補完通知）`,
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

  // 5/2以降に作成された壊れたサブスクを取得
  const { data: brokenSubs, error: fetchError } = await (supabase
    .from('subscriptions') as any)
    .select('id, stripe_subscription_id, stripe_customer_id, plan_name, shipping_address, user_id, monthly_total_amount, started_at')
    .gte('started_at', '2026-05-02T00:00:00Z')
    .order('started_at', { ascending: true });

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch subscriptions', details: fetchError.message }, { status: 500 });
  }

  const targets: BrokenSub[] = (brokenSubs || []).filter((s: any) => {
    const addr = s.shipping_address || {};
    return addr.name === 'お客様' || !addr.email;
  });

  const results: any[] = [];

  for (const sub of targets) {
    const result: any = {
      id: sub.id,
      stripe_subscription_id: sub.stripe_subscription_id,
      before: sub.shipping_address,
    };

    try {
      // Stripe からサブスクリプションと顧客情報を取得
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const meta = stripeSub.metadata || {};

      let customerEmail = meta.email || '';
      let customerName = meta.customer_name || '';

      if (!customerEmail || !customerName) {
        const stripeCustomer = await stripe.customers.retrieve(sub.stripe_customer_id);
        if (stripeCustomer && !(stripeCustomer as any).deleted) {
          const c = stripeCustomer as Stripe.Customer;
          if (!customerEmail) customerEmail = c.email || '';
          if (!customerName) customerName = c.name || '';
        }
      }

      const newShipping = {
        name: customerName || 'お客様',
        email: customerEmail,
        phone: meta.phone || sub.shipping_address?.phone || '',
        postal_code: meta.postal_code || '',
        prefecture: meta.prefecture || '',
        city: meta.city || '',
        address_detail: meta.address_detail || '',
        building: meta.building || '',
      };

      result.after = newShipping;

      // user_id を auth.users から探す
      let userId: string | null = sub.user_id;
      if (!userId && customerEmail) {
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const matched = usersData?.users?.find(u => u.email === customerEmail);
        userId = matched?.id || null;
      }
      result.user_id = userId;

      if (!dryRun) {
        // DB を更新
        const { error: updateError } = await (supabase
          .from('subscriptions') as any)
          .update({
            shipping_address: newShipping,
            user_id: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sub.id);

        if (updateError) {
          result.db_update_error = updateError.message;
        } else {
          result.db_updated = true;
        }

        // Slack 再送
        if (customerName && customerEmail) {
          const slackResult = await sendBackfillSlackNotification({
            customerName,
            customerEmail,
            planName: sub.plan_name,
            monthlyAmount: sub.monthly_total_amount,
            startedAt: sub.started_at,
          });
          result.slack = slackResult;
        } else {
          result.slack = { ok: false, reason: 'customerName or customerEmail still missing after Stripe lookup' };
        }
      }
    } catch (err: any) {
      result.error = err.message || String(err);
    }

    results.push(result);
  }

  return NextResponse.json({
    dryRun,
    matched: targets.length,
    processed: results.length,
    results,
  });
}
