import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Search Console クライアントを初期化
function getSearchConsoleClient() {
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  let privateKey = process.env.GA_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error('Google credentials not configured');
  }

  // 環境変数の \n を実際の改行に変換
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  return google.searchconsole({ version: 'v1', auth });
}

// 日付範囲を計算
function getDateRange(period: string): { startDate: string; endDate: string } {
  const today = new Date();
  // Search Consoleのデータは2-3日遅れるため、3日前を終了日とする
  today.setDate(today.getDate() - 3);
  const endDate = today.toISOString().split('T')[0];

  let startDate: string;
  switch (period) {
    case '7days':
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      startDate = sevenDaysAgo.toISOString().split('T')[0];
      break;
    case '28days':
      const twentyEightDaysAgo = new Date(today);
      twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);
      startDate = twentyEightDaysAgo.toISOString().split('T')[0];
      break;
    case '3months':
    default:
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      startDate = threeMonthsAgo.toISOString().split('T')[0];
      break;
  }

  return { startDate, endDate };
}

export async function GET(request: NextRequest) {
  const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const privateKey = process.env.GA_PRIVATE_KEY;

  if (!siteUrl) {
    return NextResponse.json({ error: 'SEARCH_CONSOLE_SITE_URL not configured' }, { status: 500 });
  }
  if (!clientEmail) {
    return NextResponse.json({ error: 'GA_CLIENT_EMAIL not configured' }, { status: 500 });
  }
  if (!privateKey) {
    return NextResponse.json({ error: 'GA_PRIVATE_KEY not configured' }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '28days';
  const { startDate, endDate } = getDateRange(period);

  try {
    const searchConsole = getSearchConsoleClient();

    // 複数のクエリを並列で実行
    const [overviewResponse, queryResponse, pageResponse, dailyResponse] = await Promise.all([
      // 全体の概要
      searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: [],
        },
      }),

      // 検索クエリ別
      searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 10,
        },
      }),

      // ページ別
      searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 10,
        },
      }),

      // 日別推移
      searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['date'],
        },
      }),
    ]);

    // レスポンスを整形
    const overviewRow = overviewResponse.data.rows?.[0];
    const overview = {
      clicks: overviewRow?.clicks || 0,
      impressions: overviewRow?.impressions || 0,
      ctr: overviewRow?.ctr || 0,
      position: overviewRow?.position || 0,
    };

    const queries = (queryResponse.data.rows || []).map((row) => ({
      query: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));

    const pages = (pageResponse.data.rows || []).map((row) => ({
      page: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }));

    const daily = (dailyResponse.data.rows || [])
      .map((row) => ({
        date: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      period,
      startDate,
      endDate,
      overview,
      queries,
      pages,
      daily,
    });
  } catch (error) {
    console.error('Search Console API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Search Console data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
