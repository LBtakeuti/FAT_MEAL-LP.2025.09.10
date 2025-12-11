import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 公開APIなのでanon keyを使用（RLSで読み取り許可が必要）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { message: 'Supabase設定が不足しています' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('ニュース取得エラー:', error);
      return NextResponse.json(
        { message: 'ニュースの取得に失敗しました', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { message: 'ニュースの取得に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}
