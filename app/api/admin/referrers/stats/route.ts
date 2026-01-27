import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface UsageRecord {
  referral_code: string;
  plan_type: string;
  plan_id: string;
  created_at: string;
  commission: number; // 紹介料
}

interface MonthlyStats {
  month: string;
  count: number;
  totalCommission: number;
  byProduct: { [key: string]: { count: number; commission: number } };
}

interface ReferrerStats {
  referral_code: string;
  totalCount: number;
  totalCommission: number;
  monthlyStats: MonthlyStats[];
  byProduct: { [key: string]: { count: number; commission: number } };
}

// 紹介料の計算
// お試しプラン（6食）: 500円
// 12食定期プラン: 1,000円
// 24食定期プラン: 2,500円
// 48食定期プラン: 4,000円
function calculateCommission(planId: string, menuSet: string): { commission: number; planType: string } {
  // お試しプラン
  if (planId === 'trial-6' || menuSet?.includes('お試し') || menuSet?.includes('6食')) {
    return { commission: 500, planType: 'お試し6食プラン' };
  }
  
  // 48食定期プラン
  if (planId === 'subscription-monthly-48' || menuSet?.includes('48食')) {
    return { commission: 4000, planType: '48食定期プラン' };
  }
  
  // 24食定期プラン
  if (planId === 'subscription-monthly-24' || menuSet?.includes('24食')) {
    return { commission: 2500, planType: '24食定期プラン' };
  }
  
  // 12食定期プラン
  if (planId === 'subscription-monthly-12' || menuSet?.includes('12食')) {
    return { commission: 1000, planType: '12食定期プラン' };
  }
  
  // デフォルト（不明なプラン）
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
    
    // 注文（お試しプラン）からの利用データを取得
    // ※お試しプランは一回購入なので、ordersテーブルのレコード = 購入回数
    let ordersQuery = client.from('orders')
      .select('referral_code, menu_set, created_at')
      .not('referral_code', 'is', null)
      .neq('referral_code', '');
    
    if (referralCode) {
      ordersQuery = ordersQuery.eq('referral_code', referralCode);
    }
    
    const ordersResult = await ordersQuery;
    
    // サブスクリプションからの利用データを取得
    // ※サブスクリプションは初回契約時のみカウント（started_atを使用）
    // ※毎月の更新はカウントしない
    let subscriptionsQuery = client.from('subscriptions')
      .select('referral_code, plan_id, plan_name, started_at')
      .not('referral_code', 'is', null)
      .neq('referral_code', '');
    
    if (referralCode) {
      subscriptionsQuery = subscriptionsQuery.eq('referral_code', referralCode);
    }
    
    const subscriptionsResult = await subscriptionsQuery;
    
    if (ordersResult.error) {
      console.error('Failed to fetch orders:', ordersResult.error);
    }
    if (subscriptionsResult.error) {
      console.error('Failed to fetch subscriptions:', subscriptionsResult.error);
    }
    
    // データを統合
    const usageRecords: UsageRecord[] = [];
    
    // 注文データ（お試しプラン）
    if (ordersResult.data) {
      for (const order of ordersResult.data) {
        if (order.referral_code) {
          const { commission, planType } = calculateCommission('trial-6', order.menu_set);
          usageRecords.push({
            referral_code: order.referral_code,
            plan_type: planType,
            plan_id: 'trial-6',
            created_at: order.created_at,
            commission,
          });
        }
      }
    }
    
    // サブスクリプションデータ（初回契約のみ）
    // ※started_atが契約開始日なので、これを使用
    if (subscriptionsResult.data) {
      for (const sub of subscriptionsResult.data) {
        if (sub.referral_code) {
          const { commission, planType } = calculateCommission(sub.plan_id, sub.plan_name);
          usageRecords.push({
            referral_code: sub.referral_code,
            plan_type: planType,
            plan_id: sub.plan_id || '',
            created_at: sub.started_at,
            commission,
          });
        }
      }
    }
    
    // 紹介コード別に集計
    const statsByCode: { [code: string]: ReferrerStats } = {};
    
    for (const record of usageRecords) {
      const code = record.referral_code;
      const month = record.created_at ? record.created_at.substring(0, 7) : 'unknown'; // YYYY-MM形式
      const planType = record.plan_type;
      
      if (!statsByCode[code]) {
        statsByCode[code] = {
          referral_code: code,
          totalCount: 0,
          totalCommission: 0,
          monthlyStats: [],
          byProduct: {},
        };
      }
      
      statsByCode[code].totalCount++;
      statsByCode[code].totalCommission += record.commission;
      
      // 商品別カウント
      if (!statsByCode[code].byProduct[planType]) {
        statsByCode[code].byProduct[planType] = { count: 0, commission: 0 };
      }
      statsByCode[code].byProduct[planType].count++;
      statsByCode[code].byProduct[planType].commission += record.commission;
      
      // 月別集計
      let monthStats = statsByCode[code].monthlyStats.find(m => m.month === month);
      if (!monthStats) {
        monthStats = { month, count: 0, totalCommission: 0, byProduct: {} };
        statsByCode[code].monthlyStats.push(monthStats);
      }
      monthStats.count++;
      monthStats.totalCommission += record.commission;
      if (!monthStats.byProduct[planType]) {
        monthStats.byProduct[planType] = { count: 0, commission: 0 };
      }
      monthStats.byProduct[planType].count++;
      monthStats.byProduct[planType].commission += record.commission;
    }
    
    // 月別を新しい順にソート
    for (const code in statsByCode) {
      statsByCode[code].monthlyStats.sort((a, b) => b.month.localeCompare(a.month));
    }
    
    // 配列に変換して返す
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
