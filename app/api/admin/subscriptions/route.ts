import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('started_at', { ascending: false }) as { data: Subscription[] | null; error: any };

    if (error) {
      console.error('Failed to fetch subscriptions:', error);
      throw error;
    }

    // 配送先情報を整形
    const formattedSubscriptions = subscriptions?.map(sub => ({
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
    })) || [];

    return NextResponse.json(formattedSubscriptions);
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
