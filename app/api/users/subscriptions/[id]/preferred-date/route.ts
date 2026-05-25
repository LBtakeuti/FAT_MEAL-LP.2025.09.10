import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// YYYY-MM-DD 形式かを判定
function isYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function getResendClient() {
  const { Resend } = await import('resend');
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// "YYYY-MM-DD" → "YYYY年M月D日（曜）"
function formatJa(ymd: string | null): string {
  if (!ymd) return '未設定';
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return ymd;
  const dow = new Date(`${ymd}T00:00:00`).getDay();
  const dowLabel = ['日', '月', '火', '水', '木', '金', '土'][dow];
  return `${parseInt(m[1], 10)}年${parseInt(m[2], 10)}月${parseInt(m[3], 10)}日（${dowLabel}）`;
}

// 配送希望日変更通知メール（fire-and-forget、失敗してもDB更新は成功扱い）
async function sendPreferredDateChangeEmail(params: {
  email: string;
  name: string;
  planName: string;
  deliveryNumber: number;
  beforeDate: string | null;
  afterDate: string;
}) {
  try {
    const resend = await getResendClient();
    if (!resend) return;

    const html = `
<!DOCTYPE html>
<html><body style="font-family: 'Hiragino Sans', sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #ea580c;">配送希望日を変更しました</h2>
    <p>${params.name} 様</p>
    <p>いつもふとるめしをご利用いただきありがとうございます。<br>
    以下の通り、配送希望日の変更を受け付けました。</p>
    <table style="border-collapse: collapse; margin: 16px 0; width: 100%;">
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>プラン</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.planName}</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>対象配送</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.deliveryNumber}回目</td></tr>
      <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>変更前</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${formatJa(params.beforeDate)}</td></tr>
      <tr><td style="padding: 8px;"><strong>変更後</strong></td><td style="padding: 8px; color: #ea580c; font-weight: bold;">${formatJa(params.afterDate)}</td></tr>
    </table>
    <p style="font-size: 12px; color: #666;">ご不明点はマイページの「お問い合わせ」よりご連絡ください。</p>
  </div>
</body></html>`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@futorumeshi.com',
      to: params.email,
      subject: '【ふとるめし】配送希望日を変更しました',
      html,
    });
  } catch (e) {
    console.error('[preferred-date] Failed to send email:', e);
  }
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

    const beforeDate = nextDelivery.preferred_delivery_date ?? nextDelivery.scheduled_date;

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

    // F3-2: メール通知（fire-and-forget、失敗してもDB更新は成功扱い）
    const shippingAddress = subscription.shipping_address as { email?: string; name?: string } | null;
    const customerEmail = shippingAddress?.email;
    const customerName = shippingAddress?.name || 'お客様';
    if (customerEmail) {
      sendPreferredDateChangeEmail({
        email: customerEmail,
        name: customerName,
        planName: subscription.plan_name || 'ふとるめし定期プラン',
        deliveryNumber,
        beforeDate,
        afterDate: preferredDate,
      });
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
