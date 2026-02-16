import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// 型安全なSupabaseクライアント用のヘルパー
function getClient(supabase: ReturnType<typeof createServerClient>) {
  return supabase as unknown as { from: (table: string) => any };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrer_code, amount, note } = body;

    if (!referrer_code || !amount || amount <= 0) {
      return NextResponse.json(
        { error: '紹介者コードと金額は必須です' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const client = getClient(supabase);

    // 支払い記録を作成
    const { data, error } = await client
      .from('referral_payouts')
      .insert({
        referrer_code,
        amount,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create payout:', error);
      return NextResponse.json(
        { error: '支払い記録の作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 支払い履歴を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const referrerCode = searchParams.get('code');

    const supabase = createServerClient();
    const client = getClient(supabase);

    let query = client.from('referral_payouts')
      .select('*')
      .order('paid_at', { ascending: false });

    if (referrerCode) {
      query = query.eq('referrer_code', referrerCode);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch payouts:', error);
      return NextResponse.json(
        { error: '支払い履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
