import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const REASON_OPTIONS = [
  // 📦 量・配送
  { value: 'too_much_quantity', label: '届く量が多すぎた', category: '量・配送' },
  { value: 'too_frequent', label: '配送の頻度が多すぎた', category: '量・配送' },
  { value: 'freezer_full', label: '冷凍庫に入りきらなかった', category: '量・配送' },
  // 🍱 商品・品質
  { value: 'taste_mismatch', label: '味が自分に合わなかった', category: '商品・品質' },
  { value: 'menu_variety', label: 'メニューのバリエーションが少なかった', category: '商品・品質' },
  { value: 'nutrition_mismatch', label: 'カロリーや栄養バランスが合わなかった', category: '商品・品質' },
  // 💰 料金
  { value: 'too_expensive', label: '料金が高いと感じた', category: '料金' },
  { value: 'unexpected_price', label: '想定していた料金と違った', category: '料金' },
  // 🎯 目的・状況変化
  { value: 'goal_reached', label: '目標体重・体型に達した', category: '目的・状況変化' },
  { value: 'sports_stopped', label: '部活・スポーツをやめた・休止した', category: '目的・状況変化' },
  { value: 'self_managed', label: '自分で食事管理できるようになった', category: '目的・状況変化' },
  { value: 'family_cooking', label: '家族・保護者が食事を用意できるようになった', category: '目的・状況変化' },
  // 🔄 サービス・使い勝手
  { value: 'confusing_ui', label: '注文・解約の操作がわかりにくかった', category: 'サービス・使い勝手' },
  { value: 'delivery_schedule', label: '配送日の調整が難しかった', category: 'サービス・使い勝手' },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');

    let query = (supabase.from('subscription_cancellation_requests') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (from) query = query.gte('created_at', `${from}T00:00:00`);
    if (to) query = query.lte('created_at', `${to}T23:59:59`);

    const { data: requests, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 集計
    const counts: Record<string, number> = {};
    REASON_OPTIONS.forEach(opt => { counts[opt.value] = 0; });

    (requests || []).forEach((req: any) => {
      const reasons: string[] = req.reasons || [];
      reasons.forEach(r => {
        if (counts[r] !== undefined) counts[r]++;
      });
    });

    const total = requests?.length || 0;
    const aggregated = REASON_OPTIONS.map(opt => ({
      value: opt.value,
      label: opt.label,
      category: opt.category,
      count: counts[opt.value],
      percentage: total > 0 ? Math.round((counts[opt.value] / total) * 100) : 0,
    }));

    return NextResponse.json({
      requests: requests || [],
      totalCount: total,
      aggregated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
