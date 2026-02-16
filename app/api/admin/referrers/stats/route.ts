import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface UsageRecord {
  referral_code: string;
  plan_type: string;
  plan_id: string;
  created_at: string;
  commission: number;
  commission_type: 'initial' | 'recurring';
}

interface MonthlyStats {
  month: string;
  count: number;
  totalCommission: number;
  initialCommission: number;
  recurringCommission: number;
  byProduct: { [key: string]: { count: number; commission: number } };
}

interface ReferrerStats {
  referral_code: string;
  totalCount: number;
  totalCommission: number;
  paidCommission: number;
  unpaidCommission: number;
  initialCommission: number;
  recurringCommission: number;
  monthlyStats: MonthlyStats[];
  byProduct: { [key: string]: { count: number; commission: number } };
}

// プランIDからプラン表示名を取得
function getPlanTypeName(planId: string): string {
  const planNames: Record<string, string> = {
    'trial-6': 'お試しプラン',
    'subscription-monthly-12': '6食定期プラン',
    'subscription-monthly-24': '12食定期プラン',
    'subscription-monthly-48': '24食定期プラン',
  };
  return planNames[planId] || planId;
}

// 紹介料の計算（フォールバック用: referral_commissionsテーブルにデータがない過去データ向け）
function calculateCommission(planId: string, menuSet: string): { commission: number; planType: string } {
  if (planId === 'trial-6' || menuSet?.includes('お試し')) {
    return { commission: 500, planType: 'お試しプラン' };
  }
  if (planId === 'subscription-monthly-48' || menuSet?.includes('24食セット') || menuSet?.includes('48食')) {
    return { commission: 4000, planType: '24食定期プラン' };
  }
  if (planId === 'subscription-monthly-24' || menuSet?.includes('12食セット') || menuSet?.includes('24食')) {
    return { commission: 2000, planType: '12食定期プラン' };
  }
  if (planId === 'subscription-monthly-12' || menuSet?.includes('6食セット') || menuSet?.includes('12食')) {
    return { commission: 1000, planType: '6食定期プラン' };
  }
  return { commission: 0, planType: menuSet || '不明' };
}

// 型安全なSupabaseクライアント用のヘルパー
function getClient(supabase: ReturnType<typeof createServerClient>) {
  return supabase as unknown as { from: (table: string) => any };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const client = getClient(supabase);

    const searchParams = request.nextUrl.searchParams;
    const referralCode = searchParams.get('code');

    const usageRecords: UsageRecord[] = [];

    // referral_commissionsテーブルからデータ取得（メインソース）
    let commissionsQuery = client.from('referral_commissions')
      .select('referral_code, source_type, plan_id, commission_type, commission_amount, created_at');

    if (referralCode) {
      commissionsQuery = commissionsQuery.eq('referral_code', referralCode);
    }

    const commissionsResult = await commissionsQuery;

    // referral_commissionsにデータがあるコードを追跡（フォールバック判定用）
    const codesInCommissions = new Set<string>();

    if (commissionsResult.data && commissionsResult.data.length > 0) {
      for (const record of commissionsResult.data) {
        codesInCommissions.add(record.referral_code);
        const planType = getPlanTypeName(record.plan_id);
        const label = record.commission_type === 'recurring'
          ? `${planType}（継続）`
          : planType;
        usageRecords.push({
          referral_code: record.referral_code,
          plan_type: label,
          plan_id: record.plan_id,
          created_at: record.created_at,
          commission: record.commission_amount,
          commission_type: record.commission_type,
        });
      }
    }

    if (commissionsResult.error) {
      console.error('Failed to fetch referral_commissions:', commissionsResult.error);
    }

    // 支払い済みコミッションを取得
    let payoutsQuery = client.from('referral_payouts')
      .select('referrer_code, amount');

    if (referralCode) {
      payoutsQuery = payoutsQuery.eq('referrer_code', referralCode);
    }

    const payoutsResult = await payoutsQuery;
    const payoutsByCode: { [code: string]: number } = {};

    if (payoutsResult.data) {
      for (const payout of payoutsResult.data) {
        if (!payoutsByCode[payout.referrer_code]) {
          payoutsByCode[payout.referrer_code] = 0;
        }
        payoutsByCode[payout.referrer_code] += payout.amount;
      }
    }

    if (payoutsResult.error) {
      console.error('Failed to fetch payouts:', payoutsResult.error);
    }

    // フォールバック: referral_commissionsにデータがないコードの分は従来ロジックで取得
    // 注文（お試しプラン）
    let ordersQuery = client.from('orders')
      .select('referral_code, menu_set, created_at')
      .not('referral_code', 'is', null)
      .neq('referral_code', '');

    if (referralCode) {
      ordersQuery = ordersQuery.eq('referral_code', referralCode);
    }

    const ordersResult = await ordersQuery;

    if (ordersResult.error) {
      console.error('Failed to fetch orders:', ordersResult.error);
    }

    if (ordersResult.data) {
      for (const order of ordersResult.data) {
        if (order.referral_code && !codesInCommissions.has(order.referral_code)) {
          const { commission, planType } = calculateCommission('trial-6', order.menu_set);
          usageRecords.push({
            referral_code: order.referral_code,
            plan_type: planType,
            plan_id: 'trial-6',
            created_at: order.created_at,
            commission,
            commission_type: 'initial',
          });
        }
      }
    }

    // サブスクリプション（初回契約のみ、フォールバック）
    let subscriptionsQuery = client.from('subscriptions')
      .select('referral_code, plan_id, plan_name, started_at')
      .not('referral_code', 'is', null)
      .neq('referral_code', '');

    if (referralCode) {
      subscriptionsQuery = subscriptionsQuery.eq('referral_code', referralCode);
    }

    const subscriptionsResult = await subscriptionsQuery;

    if (subscriptionsResult.error) {
      console.error('Failed to fetch subscriptions:', subscriptionsResult.error);
    }

    if (subscriptionsResult.data) {
      for (const sub of subscriptionsResult.data) {
        if (sub.referral_code && !codesInCommissions.has(sub.referral_code)) {
          const { commission, planType } = calculateCommission(sub.plan_id, sub.plan_name);
          usageRecords.push({
            referral_code: sub.referral_code,
            plan_type: planType,
            plan_id: sub.plan_id || '',
            created_at: sub.started_at,
            commission,
            commission_type: 'initial',
          });
        }
      }
    }

    // 紹介コード別に集計
    const statsByCode: { [code: string]: ReferrerStats } = {};

    for (const record of usageRecords) {
      const code = record.referral_code;
      const month = record.created_at ? record.created_at.substring(0, 7) : 'unknown';
      const planType = record.plan_type;

      if (!statsByCode[code]) {
        statsByCode[code] = {
          referral_code: code,
          totalCount: 0,
          totalCommission: 0,
          paidCommission: 0,
          unpaidCommission: 0,
          initialCommission: 0,
          recurringCommission: 0,
          monthlyStats: [],
          byProduct: {},
        };
      }

      statsByCode[code].totalCount++;
      statsByCode[code].totalCommission += record.commission;
      if (record.commission_type === 'recurring') {
        statsByCode[code].recurringCommission += record.commission;
      } else {
        statsByCode[code].initialCommission += record.commission;
      }

      // 商品別カウント
      if (!statsByCode[code].byProduct[planType]) {
        statsByCode[code].byProduct[planType] = { count: 0, commission: 0 };
      }
      statsByCode[code].byProduct[planType].count++;
      statsByCode[code].byProduct[planType].commission += record.commission;

      // 月別集計
      let monthStats = statsByCode[code].monthlyStats.find(m => m.month === month);
      if (!monthStats) {
        monthStats = { month, count: 0, totalCommission: 0, initialCommission: 0, recurringCommission: 0, byProduct: {} };
        statsByCode[code].monthlyStats.push(monthStats);
      }
      monthStats.count++;
      monthStats.totalCommission += record.commission;
      if (record.commission_type === 'recurring') {
        monthStats.recurringCommission += record.commission;
      } else {
        monthStats.initialCommission += record.commission;
      }
      if (!monthStats.byProduct[planType]) {
        monthStats.byProduct[planType] = { count: 0, commission: 0 };
      }
      monthStats.byProduct[planType].count++;
      monthStats.byProduct[planType].commission += record.commission;
    }

    // 月別を新しい順にソート & 支払い済み/未払いを計算
    for (const code in statsByCode) {
      statsByCode[code].monthlyStats.sort((a, b) => b.month.localeCompare(a.month));
      statsByCode[code].paidCommission = payoutsByCode[code] || 0;
      statsByCode[code].unpaidCommission = statsByCode[code].totalCommission - statsByCode[code].paidCommission;
    }

    const stats = Object.values(statsByCode);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
