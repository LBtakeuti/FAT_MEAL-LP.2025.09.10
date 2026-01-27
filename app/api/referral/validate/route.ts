import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// 紹介コードの検証API
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json(
        { valid: false, message: '紹介コードを入力してください' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 紹介コードが存在し、有効かどうかを確認
    const { data, error } = await (supabase
      .from('referrers') as any)
      .select('id, name, referral_code, is_active')
      .eq('referral_code', code.trim().toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { valid: false, message: '無効な紹介コードです' },
        { status: 200 }
      );
    }

    if (!data.is_active) {
      return NextResponse.json(
        { valid: false, message: '無効な紹介コードです' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      valid: true,
      referrerName: data.name,
      message: '紹介コードが適用されました',
    });
  } catch (error) {
    console.error('Referral code validation error:', error);
    return NextResponse.json(
      { valid: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
