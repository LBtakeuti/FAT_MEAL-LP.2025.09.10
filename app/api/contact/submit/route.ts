import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 氏名を結合
    const name = `${body.lastName ?? ''} ${body.firstName ?? ''}`.trim() || '未入力';
    const nameKana = `${body.lastNameKana ?? ''} ${body.firstNameKana ?? ''}`.trim() || '';

    // 1. Supabaseにお問い合わせを保存
    const supabase = createServerClient();

    const { data: contactData, error: dbError } = await (supabase
      .from('contacts') as any)
      .insert({
        title: body.title || '',
        name: name,
        name_kana: nameKana,
        email: body.email || '',
        phone: body.phone || '',
        message: body.message || '',
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
    } else {
      console.log('Contact saved to database:', contactData?.id);
    }

    // 2. Slack通知を送信（環境変数が設定されている場合のみ）
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (webhookUrl) {
      const payload = {
        text: '【ふとるめし お問い合わせ】',
        attachments: [
          {
            color: '#f97316',
            fields: [
              { title: '件名', value: body.title || '（なし）', short: false },
              { title: '氏名', value: name, short: true },
              { title: '氏名(カナ)', value: nameKana || '未入力', short: true },
              { title: 'メール', value: body.email || '未入力', short: true },
              { title: '電話番号', value: body.phone || '未入力', short: true },
              { title: 'メッセージ', value: body.message || '（なし）', short: false },
            ],
            footer: 'ふとるめし LP 問い合わせフォーム',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      try {
        const slackRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!slackRes.ok) {
          const text = await slackRes.text();
          console.error('Slack response error:', slackRes.status, text);
        }
      } catch (slackError) {
        console.error('Slack notification error:', slackError);
      }
    } else {
      console.warn('Slack webhook URL not configured. Skipping Slack notification.');
    }

    // データベース保存が失敗した場合のみエラーを返す
    if (dbError) {
      return NextResponse.json({
        error: 'お問い合わせの保存に失敗しました。',
        details: dbError.message
      }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: contactData?.id });
  } catch (error) {
    console.error('Contact submit error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
