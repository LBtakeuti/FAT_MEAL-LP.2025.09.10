import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const REASON_LABELS: Record<string, string> = {
  too_much_quantity: '届く量が多すぎた',
  too_frequent: '配送の頻度が多すぎた',
  freezer_full: '冷凍庫に入りきらなかった',
  taste_mismatch: '味が自分に合わなかった',
  menu_variety: 'メニューのバリエーションが少なかった',
  nutrition_mismatch: 'カロリーや栄養バランスが合わなかった',
  too_expensive: '料金が高いと感じた',
  unexpected_price: '想定していた料金と違った',
  goal_reached: '目標体重・体型に達した',
  sports_stopped: '部活・スポーツをやめた・休止した',
  self_managed: '自分で食事管理できるようになった',
  family_cooking: '家族・保護者が食事を用意できるようになった',
  confusing_ui: '注文・解約の操作がわかりにくかった',
  delivery_schedule: '配送日の調整が難しかった',
};

function labelsFor(reasons: string[]): string {
  return (reasons || []).map(r => REASON_LABELS[r] || r).join('／');
}

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

    const BOM = '\uFEFF';
    const header = '解約日,お客様名,メールアドレス,解約理由,コメント';
    const rows = (requests || []).map((r: any) => {
      const date = new Date(r.created_at).toLocaleDateString('ja-JP');
      return [
        date,
        r.customer_name || '',
        r.customer_email || '',
        labelsFor(r.reasons || []),
        r.message || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    const csv = BOM + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="cancellation_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
