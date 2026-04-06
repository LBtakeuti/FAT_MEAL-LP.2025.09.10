import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const Q1_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'google', label: 'Google検索' },
  { value: 'friends', label: '友人・知人の紹介' },
  { value: 'school_club', label: '学校・部活の関係者' },
  { value: 'other', label: 'その他' },
];

const Q2_OPTIONS = [
  { value: 'self', label: '自分' },
  { value: 'child', label: 'お子さま' },
  { value: 'partner', label: 'パートナー' },
  { value: 'other', label: 'その他' },
];

const Q3_OPTIONS = [
  { value: 'weight_gain', label: '体重・体格を増やしたい' },
  { value: 'muscle', label: '筋肉をつけてパフォーマンスを上げたい' },
  { value: 'convenience', label: '食事の準備の手間を減らしたい' },
  { value: 'nutrition', label: '栄養バランスをしっかり管理したい' },
  { value: 'competition', label: '試合・大会に向けて体をつくりたい' },
  { value: 'other', label: 'その他' },
];

function aggregateAnswers(
  surveys: any[],
  field: string,
  options: { value: string; label: string }[]
) {
  const counts: Record<string, number> = {};
  options.forEach(opt => { counts[opt.value] = 0; });

  surveys.forEach(survey => {
    const answers: string[] = survey[field] || [];
    answers.forEach(answer => {
      if (counts[answer] !== undefined) {
        counts[answer]++;
      }
    });
  });

  const total = surveys.length;
  return options.map(opt => ({
    value: opt.value,
    label: opt.label,
    count: counts[opt.value],
    percentage: total > 0 ? Math.round((counts[opt.value] / total) * 100) : 0,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');

    let query = (supabase.from('purchase_surveys') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (from) {
      query = query.gte('created_at', `${from}T00:00:00`);
    }
    if (to) {
      query = query.lte('created_at', `${to}T23:59:59`);
    }

    const { data: surveys, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const aggregated = {
      q1: aggregateAnswers(surveys || [], 'q1_answers', Q1_OPTIONS),
      q2: aggregateAnswers(surveys || [], 'q2_answers', Q2_OPTIONS),
      q3: aggregateAnswers(surveys || [], 'q3_answers', Q3_OPTIONS),
    };

    return NextResponse.json({
      surveys: surveys || [],
      totalCount: surveys?.length || 0,
      aggregated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
