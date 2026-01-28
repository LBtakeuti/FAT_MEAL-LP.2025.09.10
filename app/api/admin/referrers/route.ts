import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// 紹介者の型定義
interface Referrer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  referral_code: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 紹介コードを自動生成（8文字のアルファベット大文字+数字）
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 紛らわしい文字を除外
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 型安全なSupabaseクライアント用のヘルパー
function getClient(supabase: ReturnType<typeof createServerClient>) {
  return supabase as unknown as { from: (table: string) => any };
}

// 一覧取得
export async function GET() {
  try {
    const supabase = createServerClient();
    const client = getClient(supabase);
    
    const result = await client.from('referrers')
      .select('*')
      .order('created_at', { ascending: false });

    if (result.error) {
      console.error('Failed to fetch referrers:', result.error);
      return NextResponse.json(
        { error: 'Failed to fetch referrers' },
        { status: 500 }
      );
    }

    return NextResponse.json((result.data as Referrer[]) || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 新規作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const client = getClient(supabase);
    const body = await request.json();

    const { name, email, phone, notes, referral_code: customCode } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '紹介者名は必須です' },
        { status: 400 }
      );
    }

    let referralCode: string;

    // カスタム紹介コードが指定されている場合
    if (customCode && customCode.trim() !== '') {
      const code = customCode.trim().toUpperCase();

      // 形式チェック（大文字英字と数字のみ、4〜12文字）
      if (!/^[A-Z0-9]{4,12}$/.test(code)) {
        return NextResponse.json(
          { error: '紹介コードは大文字英字と数字のみ、4〜12文字で入力してください' },
          { status: 400 }
        );
      }

      // 重複チェック
      const checkResult = await client.from('referrers')
        .select('id')
        .eq('referral_code', code)
        .single();

      if (checkResult.data) {
        return NextResponse.json(
          { error: 'この紹介コードは既に使用されています' },
          { status: 400 }
        );
      }

      referralCode = code;
    } else {
      // 自動生成
      referralCode = generateReferralCode();
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const checkResult = await client.from('referrers')
          .select('id')
          .eq('referral_code', referralCode)
          .single();

        if (!checkResult.data) break;

        referralCode = generateReferralCode();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: '紹介コードの生成に失敗しました。再度お試しください。' },
          { status: 500 }
        );
      }
    }

    const result = await client.from('referrers')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        referral_code: referralCode,
        notes: notes?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (result.error) {
      console.error('Failed to create referrer:', result.error);
      return NextResponse.json(
        { error: 'Failed to create referrer' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
