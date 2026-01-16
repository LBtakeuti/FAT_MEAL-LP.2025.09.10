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

    console.log(`[Subscriptions API] Searching for userId: ${userId}, email: ${email}`);

    // デバッグ: 全サブスクリプションを取得して確認
    const { data: allSubs, error: allError } = await (supabase
      .from('subscriptions') as any)
      .select('id, user_id, status, plan_name, shipping_address, started_at')
      .order('started_at', { ascending: false })
      .limit(10);
    
    if (!allError && allSubs) {
      console.log(`[Subscriptions API] All recent subscriptions in DB (${allSubs.length}):`, 
        allSubs.map((s: any) => ({
          id: s.id,
          user_id: s.user_id,
          email: s.shipping_address?.email,
          status: s.status,
          plan_name: s.plan_name,
          started_at: s.started_at
        }))
      );
    }

    let subscriptions: any[] = [];

    // まずuserIdで検索
    if (userId) {
      const { data: userIdResults, error: userIdError } = await (supabase
        .from('subscriptions') as any)
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false });

      if (userIdError) {
        console.error('Failed to fetch subscriptions by userId:', userIdError);
      } else {
        console.log(`[Subscriptions API] Found ${userIdResults?.length || 0} subscriptions by userId`);
        if (userIdResults && userIdResults.length > 0) {
          subscriptions = userIdResults;
        }
      }
    }

    // userIdで見つからなかった場合、emailでも検索
    if (subscriptions.length === 0 && email) {
      const { data: emailResults, error: emailError } = await (supabase
        .from('subscriptions') as any)
        .select('*')
        .filter('shipping_address->>email', 'eq', email)
        .order('started_at', { ascending: false });

      if (emailError) {
        console.error('Failed to fetch subscriptions by email:', emailError);
      } else {
        console.log(`[Subscriptions API] Found ${emailResults?.length || 0} subscriptions by email`);
        if (emailResults) {
          subscriptions = emailResults;
        }
      }
    }

    // userIdで検索しても見つからない場合、user_idがnullのレコードをemailで追加検索
    if (userId && email && subscriptions.length === 0) {
      const { data: nullUserIdResults, error: nullError } = await (supabase
        .from('subscriptions') as any)
        .select('*')
        .is('user_id', null)
        .filter('shipping_address->>email', 'eq', email)
        .order('started_at', { ascending: false });

      if (!nullError && nullUserIdResults) {
        console.log(`[Subscriptions API] Found ${nullUserIdResults?.length || 0} subscriptions with null user_id`);
        subscriptions = nullUserIdResults;

        // user_idがnullのレコードを更新
        for (const sub of nullUserIdResults) {
          console.log(`[Subscriptions API] Updating user_id for subscription ${sub.id}`);
          await (supabase
            .from('subscriptions') as any)
            .update({ user_id: userId })
            .eq('id', sub.id);
        }
      }
    }

    console.log(`[Subscriptions API] Final result: ${subscriptions.length} subscriptions found`);

    // 各サブスクリプションの配送情報を取得
    const formattedSubscriptions = await Promise.all(
      (subscriptions || []).map(async (sub: any) => {
        // 配送情報を取得
        const { data: deliveries } = await (supabase
          .from('subscription_deliveries') as any)
          .select('id, status, scheduled_date, menu_set')
          .eq('subscription_id', sub.id)
          .order('scheduled_date', { ascending: true });

        const totalDeliveries = deliveries?.length || 0;
        const completedDeliveries = deliveries?.filter((d: any) => d.status === 'shipped').length || 0;
        const pendingDeliveries = deliveries?.filter((d: any) => d.status === 'pending') || [];
        const nextDelivery = pendingDeliveries[0] || null;

        return {
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
          // 配送進捗情報
          delivery_progress: {
            total: totalDeliveries,
            completed: completedDeliveries,
            pending: pendingDeliveries.length,
            next_delivery: nextDelivery ? {
              date: nextDelivery.scheduled_date,
              menu_set: nextDelivery.menu_set,
            } : null,
            deliveries: deliveries || [],
          },
        };
      })
    );

    return NextResponse.json({ subscriptions: formattedSubscriptions });
  } catch (error) {
    console.error('Failed to fetch user subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
