import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// GA4 クライアントを初期化
function getAnalyticsClient() {
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  let privateKey = process.env.GA_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('GA4 credentials not configured');
  }

  // 環境変数の \n を実際の改行に変換（複数のパターンに対応）
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n');

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

// 日付範囲を計算
function getDateRange(period: string): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];

  let startDate: string;
  switch (period) {
    case 'today':
      startDate = endDate;
      break;
    case '7days':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      startDate = sevenDaysAgo.toISOString().split('T')[0];
      break;
    case '30days':
    default:
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
      break;
  }

  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  // 環境変数チェック
  const propertyId = process.env.GA_PROPERTY_ID;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY;

  if (!propertyId) {
    return NextResponse.json({ error: 'GA4 Property ID not configured' }, { status: 500 });
  }
  if (!clientEmail) {
    return NextResponse.json({ error: 'GA_CLIENT_EMAIL not configured' }, { status: 500 });
  }
  if (!privateKey) {
    return NextResponse.json({ error: 'GA_PRIVATE_KEY not configured' }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '30days';
  const { startDate, endDate } = getDateRange(period);

  try {
    const analyticsClient = getAnalyticsClient();

    // 複数のレポートを並列で取得
    const [
      overviewResponse,
      dailyResponse,
      deviceResponse,
      sourceResponse,
      pageResponse,
    ] = await Promise.all([
      // 概要（合計値）
      analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),

      // 日別データ
      analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'screenPageViews' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      }),

      // デバイス別
      analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      }),

      // 流入元
      analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 10,
      }),

      // 人気ページ
      analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
    ]);

    // レスポンスを整形
    const overview = {
      activeUsers: parseInt(overviewResponse[0]?.rows?.[0]?.metricValues?.[0]?.value || '0'),
      sessions: parseInt(overviewResponse[0]?.rows?.[0]?.metricValues?.[1]?.value || '0'),
      pageViews: parseInt(overviewResponse[0]?.rows?.[0]?.metricValues?.[2]?.value || '0'),
      bounceRate: parseFloat(overviewResponse[0]?.rows?.[0]?.metricValues?.[3]?.value || '0'),
      avgSessionDuration: parseFloat(overviewResponse[0]?.rows?.[0]?.metricValues?.[4]?.value || '0'),
    };

    const daily = (dailyResponse[0]?.rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[1]?.value || '0'),
    }));

    const devices = (deviceResponse[0]?.rows || []).map((row) => ({
      device: row.dimensionValues?.[0]?.value || '',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    const sources = (sourceResponse[0]?.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || '',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    const pages = (pageResponse[0]?.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '',
      pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
    }));

    return NextResponse.json({
      period,
      startDate,
      endDate,
      overview,
      daily,
      devices,
      sources,
      pages,
    });
  } catch (error) {
    console.error('GA4 API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
