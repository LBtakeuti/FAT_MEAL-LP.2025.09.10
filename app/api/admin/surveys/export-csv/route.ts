import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const Q1_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube',
  google: 'Google検索', friends: '友人・知人の紹介', school_club: '学校・部活の関係者', other: 'その他',
};
const Q2_LABELS: Record<string, string> = {
  self: '自分', child: 'お子さま', partner: 'パートナー', other: 'その他',
};
const Q3_LABELS: Record<string, string> = {
  weight_gain: '体重・体格を増やしたい', muscle: '筋肉をつけてパフォーマンスを上げたい',
  convenience: '食事の準備の手間を減らしたい', nutrition: '栄養バランスをしっかり管理したい',
  competition: '試合・大会に向けて体をつくりたい', other: 'その他',
};

function labelsFor(answers: string[], map: Record<string, string>): string {
  return (answers || []).map(a => map[a] || a).join('／');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');

    let query = (supabase.from('purchase_surveys') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (from) query = query.gte('created_at', `${from}T00:00:00`);
    if (to) query = query.lte('created_at', `${to}T23:59:59`);

    const { data: surveys, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const BOM = '\uFEFF';
    const header = '回答日,メールアドレス,Q1_認知経路,Q1_その他,Q2_利用者,Q2_その他,Q3_期待,Q3_その他';
    const rows = (surveys || []).map((s: any) => {
      const date = new Date(s.created_at).toLocaleDateString('ja-JP');
      return [
        date,
        s.customer_email,
        labelsFor(s.q1_answers, Q1_LABELS),
        s.q1_other_text || '',
        labelsFor(s.q2_answers, Q2_LABELS),
        s.q2_other_text || '',
        labelsFor(s.q3_answers, Q3_LABELS),
        s.q3_other_text || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = BOM + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="survey_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
