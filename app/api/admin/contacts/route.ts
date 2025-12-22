import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('お問い合わせ取得エラー:', error);
      return NextResponse.json(
        { message: 'お問い合わせの取得に失敗しました', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Failed to fetch contacts:', error);
    return NextResponse.json(
      { message: 'お問い合わせの取得に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}












