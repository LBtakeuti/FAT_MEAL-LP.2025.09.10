import { NextRequest, NextResponse } from 'next/server';

// テスト用Slack通知API（本番では無効化してください）
export async function POST(request: NextRequest) {
  // 開発環境のみ有効
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'This endpoint is disabled in production' }, { status: 403 });
  }

  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    return NextResponse.json({ error: 'SLACK_WEBHOOK_URL is not set' }, { status: 500 });
  }

  // テスト用データ
  const testData = {
    customerName: 'テスト太郎',
    customerEmail: 'test@example.com',
    orderId: 'TEST-' + Date.now(),
    amount: 3600,
    items: '【テスト】ふとるめし3個セット × 1',
  };

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 新規注文が入りました！（テスト）',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*お客様名:*\n${testData.customerName}`,
          },
          {
            type: 'mrkdwn',
            text: `*メール:*\n${testData.customerEmail}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*注文番号:*\n${testData.orderId.slice(-8).toUpperCase()}`,
          },
          {
            type: 'mrkdwn',
            text: `*合計金額:*\n¥${testData.amount.toLocaleString()}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*注文内容:*\n${testData.items}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📅 ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} (テスト通知)`,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Slack notification failed:', errorText);
      return NextResponse.json({ error: 'Failed to send Slack notification', details: errorText }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Test notification sent to Slack' });
  } catch (error) {
    console.error('Error sending Slack notification:', error);
    return NextResponse.json({ error: 'Error sending notification' }, { status: 500 });
  }
}
