import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// YYYY-MM-DD 形式かを判定
function isYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: subscriptionId } = await params;
    if (!subscriptionId) {
      return NextResponse.json({ error: 'id は必須です' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const userId = body?.userId as string | undefined;
    const preferredDate = body?.preferred_delivery_date;

    if (!userId) {
      return NextResponse.json({ error: 'userId は必須です' }, { status: 400 });
    }
    if (!isYmd(preferredDate)) {
      return NextResponse.json(
        { error: 'preferred_delivery_date は YYYY-MM-DD 形式で指定してください' },
        { status: 400 },
      );
    }

    const supabase = createServerClient() as any;

    // サブスク所有者チェック
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, user_id, plan_name, shipping_address, status')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'サブスクリプションが見つかりません' }, { status: 404 });
    }
    if (subscription.user_id !== userId) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'このサブスクリプションは現在変更できません' },
        { status: 400 },
      );
    }

    // 次回 pending 配送を特定（scheduled_date が最も早い pending）
    const todayJST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { data: nextDelivery, error: deliveryError } = await supabase
      .from('subscription_deliveries')
      .select('id, scheduled_date, preferred_delivery_date, status')
      .eq('subscription_id', subscriptionId)
      .eq('status', 'pending')
      .gte('scheduled_date', todayJST)
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (deliveryError) {
      return NextResponse.json(
        { error: '次回配送の取得に失敗しました' },
        { status: 500 },
      );
    }
    if (!nextDelivery) {
      return NextResponse.json(
        { error: '変更可能な次回配送がありません' },
        { status: 400 },
      );
    }

    // 配送回数（N回目）を計算: shipped + delivered の合計 + 1
    const { count: completedCount } = await supabase
      .from('subscription_deliveries')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_id', subscriptionId)
      .in('status', ['shipped', 'delivered']);
    const deliveryNumber = (completedCount ?? 0) + 1;

    // 更新
    const { error: updateError } = await supabase
      .from('subscription_deliveries')
      .update({
        preferred_delivery_date: preferredDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', nextDelivery.id);

    if (updateError) {
      return NextResponse.json(
        { error: '配送希望日の更新に失敗しました' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      delivery_id: nextDelivery.id,
      preferred_delivery_date: preferredDate,
      delivery_number: deliveryNumber,
    });
  } catch (error) {
    console.error('[preferred-date] error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
