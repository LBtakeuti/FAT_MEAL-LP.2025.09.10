import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('Slack webhook URL not configured.');
      return NextResponse.json({ error: 'Slack webhook URL is not configured.' }, { status: 500 });
    }

    const payload = {
      text: '【ふとるめし お問い合わせ】',
      attachments: [
        {
          color: '#f97316',
          fields: [
            { title: '氏名', value: `${body.lastName ?? ''} ${body.firstName ?? ''}`.trim() || '未入力', short: true },
            { title: '氏名(カナ)', value: `${body.lastNameKana ?? ''} ${body.firstNameKana ?? ''}`.trim() || '未入力', short: true },
            { title: 'メール', value: body.email || '未入力', short: true },
            { title: '電話番号', value: body.phone || '未入力', short: true },
            { title: '件名', value: body.title || '（なし）', short: false },
            { title: 'メッセージ', value: body.message || '（なし）', short: false },
          ],
          footer: 'ふとるめし LP 問い合わせフォーム',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!slackRes.ok) {
      const text = await slackRes.text();
      console.error('Slack response error:', slackRes.status, text);
      return NextResponse.json({ error: 'Failed to send message to Slack.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}


