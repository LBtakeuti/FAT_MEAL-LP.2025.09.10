import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * F36: 認証 + 所有者強制。
 * トークンから取得した user.id を常に正とし、リクエストの userId は無視する。
 * 未認証: 401。トークンの id とリクエストの id が一致しない場合: 403。
 */
async function requireAuth(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated || !auth.user) {
    return { error: NextResponse.json({ error: '認証が必要です' }, { status: 401 }) };
  }
  return { user: auth.user };
}

// GET: ユーザープロフィールを取得（認証ユーザー自身のみ）
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const requestedUserId = request.nextUrl.searchParams.get('userId');
    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json({ error: '他ユーザーのプロフィールは取得できません' }, { status: 403 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'プロフィールが見つかりません' }, { status: 404 });
      }
      console.error('Failed to fetch user profile:', error);
      return NextResponse.json({ error: 'プロフィールの取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// POST: ユーザープロフィールを作成（認証ユーザー自身のみ）
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    // F36: userId/email/id はトークンから上書き。リクエスト値は信頼しない。
    const profileData: Record<string, unknown> = { ...body };
    delete profileData.userId;
    delete profileData.id;
    delete profileData.email;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        email: user.email,
        ...profileData,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create user profile:', error);
      return NextResponse.json({ error: 'プロフィールの作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}

// 住所同期の対象キー（user_profiles と shipping_address のマッピング元）
const ADDRESS_KEYS = [
  'last_name',
  'first_name',
  'phone',
  'postal_code',
  'prefecture',
  'city',
  'address_detail',
  'building',
] as const;

// PATCH: ユーザープロフィールを更新（認証ユーザー自身のみ）
// F41: 住所系フィールド変更時に subscriptions.shipping_address も同期（ベストエフォート）。
//      失敗してもプロフィール更新自体は成功とし、レスポンスで失敗を通知する。
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    // F36: userId/email/id はトークンから上書き不可。
    const updateData: Record<string, unknown> = { ...body };
    delete updateData.userId;
    delete updateData.id;
    delete updateData.email;

    const supabase = createServerClient();
    const { data, error } = await (supabase
      .from('user_profiles') as any)
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user profile:', error);
      return NextResponse.json({ error: 'プロフィールの更新に失敗しました' }, { status: 500 });
    }

    // F41: 住所系フィールドが含まれていれば、active/past_due のサブスクリプションの
    // shipping_address を最新の user_profiles 値で上書きする。
    const addressTouched = ADDRESS_KEYS.some((k) => k in updateData);
    let syncedSubscriptions = 0;
    let syncFailed = false;

    if (addressTouched) {
      try {
        const profile = data as Record<string, any>;
        const { data: subs, error: subsFetchError } = await (supabase
          .from('subscriptions') as any)
          .select('id, shipping_address')
          .eq('user_id', user.id)
          .in('status', ['active', 'past_due']);

        if (subsFetchError) {
          console.error('[profile sync] subscription fetch failed:', subsFetchError);
          syncFailed = true;
        } else if (subs && subs.length > 0) {
          for (const sub of subs) {
            const current = (sub.shipping_address as Record<string, any>) || {};
            const newShipping = {
              ...current,
              // email は既存値を保持（指示通り）
              name: `${profile.last_name || ''} ${profile.first_name || ''}`.trim(),
              phone: profile.phone || '',
              postal_code: profile.postal_code || '',
              prefecture: profile.prefecture || '',
              city: profile.city || '',
              address_detail: profile.address_detail || '',
              building: profile.building || '',
            };
            const { error: subUpdateError } = await (supabase
              .from('subscriptions') as any)
              .update({ shipping_address: newShipping })
              .eq('id', sub.id);
            if (subUpdateError) {
              console.error(`[profile sync] subscription ${sub.id} update failed:`, subUpdateError);
              syncFailed = true;
            } else {
              syncedSubscriptions += 1;
            }
          }
        }
      } catch (syncError) {
        console.error('[profile sync] unexpected error:', syncError);
        syncFailed = true;
      }
    }

    return NextResponse.json({ ...data, syncedSubscriptions, syncFailed });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
