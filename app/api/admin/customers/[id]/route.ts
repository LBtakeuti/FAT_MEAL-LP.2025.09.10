import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withAuthDynamic, jsonSuccess, jsonNotFound } from '@/lib/api-helpers';

export const GET = withAuthDynamic(async (
  _request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;

  // id形式: "member:uuid", "guest:email", "tiktok:key"
  const [type, ...rest] = id.split(':');
  const key = rest.join(':');

  if (type === 'member') {
    // 会員: user_profilesからプロフィール取得
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', key)
      .single();

    if (!profile) return jsonNotFound('顧客が見つかりません');

    const email = profile.email;

    const [ordersRes, subsRes, surveysRes, tiktokRes] = await Promise.all([
      supabase.from('orders').select('*').eq('customer_email', email).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').eq('user_id', key).order('created_at', { ascending: false }),
      supabase.from('purchase_surveys').select('*').eq('customer_email', email),
      supabase.from('tiktok_shop_orders').select('*').eq('phone', profile.phone || '__none__').order('created_time', { ascending: false }),
    ]);

    return jsonSuccess({
      profile,
      orders: ordersRes.data || [],
      subscriptions: subsRes.data || [],
      surveys: surveysRes.data || [],
      tiktok_orders: tiktokRes.data || [],
    });
  }

  if (type === 'guest') {
    // ゲスト: emailで全データ取得
    const email = key;

    const [ordersRes, subsRes, surveysRes] = await Promise.all([
      supabase.from('orders').select('*').eq('customer_email', email).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*'),
      supabase.from('purchase_surveys').select('*').eq('customer_email', email),
    ]);

    // subscriptionsはshipping_address.emailでフィルタ（クライアント側）
    const matchedSubs = (subsRes.data || []).filter((s: any) => {
      const addr = s.shipping_address as any;
      return addr?.email && addr.email.toLowerCase() === email.toLowerCase();
    });

    // 最初の注文から名前を取得
    const firstOrder = (ordersRes.data || [])[0];
    const profile = {
      email,
      first_name: null,
      last_name: null,
      phone: firstOrder?.phone || null,
      customer_name: firstOrder?.customer_name || '',
    };

    return jsonSuccess({
      profile,
      orders: ordersRes.data || [],
      subscriptions: matchedSubs,
      surveys: surveysRes.data || [],
      tiktok_orders: [],
    });
  }

  if (type === 'tiktok') {
    // TikTok顧客: 電話番号またはrecipientでマッチ
    const isNameKey = key.startsWith('name:');
    let tiktokOrders: any[] = [];

    if (isNameKey) {
      const name = key.slice(5);
      const { data } = await supabase.from('tiktok_shop_orders').select('*').eq('recipient', name).order('created_time', { ascending: false });
      tiktokOrders = data || [];
    } else {
      // 電話番号マッチ（部分一致）
      const { data } = await supabase.from('tiktok_shop_orders').select('*').order('created_time', { ascending: false });
      const normalizePhone = (p: string | null) => {
        if (!p) return '';
        const digits = p.replace(/[^0-9]/g, '');
        return digits.startsWith('81') ? '0' + digits.slice(2) : digits;
      };
      const targetPhone = key;
      tiktokOrders = (data || []).filter((t: any) => normalizePhone(t.phone) === targetPhone);
    }

    const firstOrder = tiktokOrders[0];
    const profile = {
      email: null,
      first_name: firstOrder?.first_name || null,
      last_name: firstOrder?.last_name || null,
      phone: firstOrder?.phone || null,
      customer_name: firstOrder?.recipient || [firstOrder?.last_name, firstOrder?.first_name].filter(Boolean).join(' ') || '',
    };

    return jsonSuccess({
      profile,
      orders: [],
      subscriptions: [],
      surveys: [],
      tiktok_orders: tiktokOrders,
    });
  }

  return jsonNotFound('顧客が見つかりません');
});
