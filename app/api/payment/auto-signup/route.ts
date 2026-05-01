/**
 * 購入フロー中の自動会員登録API
 * サーバーサイドでadmin.createUserを使い、メール確認なしで即ログイン可能にする
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, firstNameKana, lastNameKana, phone, postalCode, prefecture, city, addressDetail, building } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'パスワードは6文字以上で入力してください' }, { status: 400 });
    }

    const supabase = createServerClient();

    // admin APIでユーザー作成（メール確認済みとして作成）
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
        return NextResponse.json({ error: 'このメールアドレスは既に登録されています。ログインしてからお試しください。' }, { status: 409 });
      }
      console.error('Auto signup error:', createError.message);
      return NextResponse.json({ error: '会員登録に失敗しました' }, { status: 500 });
    }

    if (!userData.user) {
      return NextResponse.json({ error: '会員登録に失敗しました' }, { status: 500 });
    }

    // プロフィールを作成（upsertで重複対応）
    const { error: profileError } = await (supabase.from('user_profiles') as any).upsert({
      id: userData.user.id,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      first_name_kana: firstNameKana || null,
      last_name_kana: lastNameKana || null,
      phone: phone || null,
      postal_code: postalCode || null,
      prefecture: prefecture || null,
      city: city || null,
      address_detail: addressDetail || null,
      building: building || null,
    }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError.message);
    }

    return NextResponse.json({
      userId: userData.user.id,
      email: userData.user.email,
    });
  } catch (error) {
    console.error('Auto signup error:', error);
    return NextResponse.json({ error: '会員登録に失敗しました' }, { status: 500 });
  }
}
