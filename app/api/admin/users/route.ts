import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withAuth } from '@/lib/api-helpers';
import { jsonSuccess, jsonError, handleSupabaseError, getPaginationParams, getQueryParam } from '@/lib/api-helpers';

export const GET = withAuth(async (request: NextRequest) => {
  const supabase = createServerClient();
  const { page, limit, offset } = getPaginationParams(request, 20);
  const search = getQueryParam(request, 'search');

  // ユーザー一覧を取得
  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' });

  // 検索フィルター
  if (search) {
    query = query.or(
      `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  const { data: users, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return handleSupabaseError(error, 'ユーザー一覧の取得');

  // 各ユーザーの注文数・サブスク状態を集計
  const userIds = (users || []).map((u) => u.id);
  const emails = (users || []).map((u) => u.email);

  // 注文数を取得
  const { data: orderCounts } = await supabase
    .from('orders')
    .select('user_id, customer_email')
    .in('customer_email', emails);

  // サブスクリプション状態を取得
  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id, status, plan_name, monthly_total_amount')
    .in('user_id', userIds);

  // 集計マップを作成
  const orderCountMap: Record<string, number> = {};
  (orderCounts || []).forEach((o) => {
    const email = o.customer_email;
    orderCountMap[email] = (orderCountMap[email] || 0) + 1;
  });

  const subscriptionMap: Record<string, { status: string; plan_name: string; monthly_total_amount: number }[]> = {};
  (subscriptions || []).forEach((s) => {
    if (s.user_id) {
      if (!subscriptionMap[s.user_id]) subscriptionMap[s.user_id] = [];
      subscriptionMap[s.user_id].push({
        status: s.status,
        plan_name: s.plan_name,
        monthly_total_amount: s.monthly_total_amount,
      });
    }
  });

  const enrichedUsers = (users || []).map((user) => ({
    ...user,
    order_count: orderCountMap[user.email] || 0,
    subscriptions: subscriptionMap[user.id] || [],
  }));

  return jsonSuccess({
    users: enrichedUsers,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
});
