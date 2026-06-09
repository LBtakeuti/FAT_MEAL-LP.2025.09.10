import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

// GET: ユーザーの注文履歴を取得（認証ユーザー自身のみ）
// F36: 検索条件は常にトークンの email で上書き。クエリの email は不一致なら 403。
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated || !auth.user || !auth.user.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const requestedEmail = request.nextUrl.searchParams.get('email');
    if (requestedEmail && requestedEmail.toLowerCase() !== auth.user.email.toLowerCase()) {
      return NextResponse.json({ error: '他ユーザーの注文履歴は取得できません' }, { status: 403 });
    }

    const supabase = createServerClient();

    // 注文履歴を取得（新しい順）— 検索条件はトークンの email で固定
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', auth.user.email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch orders:', error);
      return NextResponse.json(
        { error: '注文履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
