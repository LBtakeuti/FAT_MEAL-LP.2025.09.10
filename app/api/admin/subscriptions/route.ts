import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import Stripe from 'stripe';

interface Subscription {
  id: string;
  user_id: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_id: string;
  plan_name: string;
  meals_per_delivery: number;
  deliveries_per_month: number;
  monthly_product_price: number;
  monthly_shipping_fee: number;
  monthly_total_amount: number;
  next_delivery_date: string | null;
  preferred_delivery_date: string | null;
  shipping_address: {
    name?: string;
    email?: string;
    phone?: string;
    postal_code?: string;
    prefecture?: string;
    city?: string;
    address_detail?: string;
    building?: string;
  };
  status: 'active' | 'paused' | 'canceled' | 'past_due';
  payment_status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  started_at: string;
  current_period_start: string;
  current_period_end: string;
  canceled_at: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Step 1: サブスクリプションを取得（解約済み含む）
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('started_at', { ascending: false }) as { data: Subscription[] | null; error: any };

    console.log('[subscriptions API] count:', subscriptions?.length ?? 0, 'error:', error?.message ?? 'none');

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      throw error;
    }

    // Step 2: 配送情報を別クエリで取得（RLS干渉を回避）
    const subIds = (subscriptions || []).map((s) => s.id);
    const deliveriesMap: Record<string, any[]> = {};

    if (subIds.length > 0) {
      const { data: deliveries } = await (supabase as any)
        .from('subscription_deliveries')
        .select('id, status, scheduled_date, menu_set, carrier_notified_at, subscription_id')
        .in('subscription_id', subIds);

      for (const d of ((deliveries as any[]) || [])) {
        if (!deliveriesMap[d.subscription_id]) deliveriesMap[d.subscription_id] = [];
        deliveriesMap[d.subscription_id].push(d);
      }
    }

    // Step 2.5: 解約理由を取得
    const canceledSubIds = (subscriptions || []).filter(s => s.status === 'canceled').map(s => s.id);
    const cancellationMap: Record<string, { reasons: string[]; reason: string | null; message: string | null; created_at: string }> = {};
    if (canceledSubIds.length > 0) {
      const { data: cancelRequests } = await (supabase as any)
        .from('subscription_cancellation_requests')
        .select('subscription_id, reasons, reason, message, created_at')
        .in('subscription_id', canceledSubIds)
        .order('created_at', { ascending: false });
      for (const req of ((cancelRequests as any[]) || [])) {
        if (!cancellationMap[req.subscription_id]) {
          cancellationMap[req.subscription_id] = {
            reasons: req.reasons || [],
            reason: req.reason,
            message: req.message,
            created_at: req.created_at,
          };
        }
      }
    }

    // Step 3: マージして整形
    const formattedSubscriptions = subscriptions?.map(sub => {
      const deliveries = deliveriesMap[sub.id] || [];
      const totalDeliveries = deliveries.length;
      const completedDeliveries = deliveries.filter((d: any) => d.status === 'shipped').length;
      const pendingDeliveries = deliveries.filter((d: any) => d.status === 'pending');
      const nextDelivery = pendingDeliveries.sort((a: any, b: any) =>
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
      )[0];

      return {
        id: sub.id,
        customer_name: sub.shipping_address?.name || 'お客様',
        customer_email: sub.shipping_address?.email || '',
        plan_name: sub.plan_name,
        plan_id: sub.plan_id,
        meals_per_delivery: sub.meals_per_delivery,
        deliveries_per_month: sub.deliveries_per_month,
        monthly_total_amount: sub.monthly_total_amount,
        next_delivery_date: sub.next_delivery_date,
        preferred_delivery_date: sub.preferred_delivery_date,
        status: sub.status,
        payment_status: sub.payment_status,
        started_at: sub.started_at,
        canceled_at: sub.canceled_at,
        shipping_address: sub.shipping_address,
        // 配送進捗情報
        delivery_progress: {
          total: totalDeliveries,
          completed: completedDeliveries,
          pending: pendingDeliveries.length,
          next_delivery: nextDelivery ? {
            date: nextDelivery.scheduled_date,
            menu_set: nextDelivery.menu_set,
          } : null,
          estimated_next_delivery: !nextDelivery && sub.current_period_end
            ? { date: sub.current_period_end, is_estimated: true }
            : null,
        },
        // 全配送レコード（リマインダー表示用）
        subscription_deliveries: deliveries,
        // 解約理由
        cancellation_request: cancellationMap[sub.id] || null,
      };
    }) || [];

    return NextResponse.json(formattedSubscriptions);
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = createServerClient();

  const { data: sub, error: fetchError } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('id', id)
    .single();

  if (fetchError || !sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  } catch (stripeError) {
    console.error('Stripe cancellation failed:', stripeError);
    return NextResponse.json({ error: 'Stripe cancellation failed' }, { status: 500 });
  }

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('id', id);

  return NextResponse.json({ success: true });
}
