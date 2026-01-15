import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const userId = request.nextUrl.searchParams.get('userId');
    const email = request.nextUrl.searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'userId or email is required' },
        { status: 400 }
      );
    }

    // userIdで検索、なければemailで検索
    let query = (supabase
      .from('subscriptions') as any)
      .select('*')
      .order('started_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      // emailはshipping_addressのJSONB内にある
      query = query.filter('shipping_address->>email', 'eq', email);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      throw error;
    }

    // フォーマットして返す
    const formattedSubscriptions = subscriptions?.map((sub: any) => ({
      id: sub.id,
      plan_name: sub.plan_name,
      plan_id: sub.plan_id,
      meals_per_delivery: sub.meals_per_delivery,
      deliveries_per_month: sub.deliveries_per_month,
      monthly_product_price: sub.monthly_product_price,
      monthly_shipping_fee: sub.monthly_shipping_fee,
      monthly_total_amount: sub.monthly_total_amount,
      next_delivery_date: sub.next_delivery_date,
      preferred_delivery_date: sub.preferred_delivery_date,
      status: sub.status,
      payment_status: sub.payment_status,
      started_at: sub.started_at,
      canceled_at: sub.canceled_at,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      stripe_subscription_id: sub.stripe_subscription_id,
    })) || [];

    return NextResponse.json({ subscriptions: formattedSubscriptions });
  } catch (error) {
    console.error('Failed to fetch user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
