import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createServerClient } from '@/lib/supabase';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

    // 3. お問い合わせ受付メールを送信
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || '';
    if (resendApiKey && fromEmail && body.email) {
      try {
        const resend = new Resend(resendApiKey);
        const escapedTitle = escapeHtml(body.title || '（なし）');
        const escapedMessage = escapeHtml(body.message || '（なし）');
        const escapedName = escapeHtml(name);

        await resend.emails.send({
          from: fromEmail,
          to: body.email,
          subject: '【ふとるめし】お問い合わせを受け付けました',
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.8; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #fff; padding: 30px; }
    .inquiry-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <p>${escapedName} 様</p>
      <p>この度はお問い合わせいただき、誠にありがとうございます。</p>
      <p>以下の内容でお問い合わせを受け付けました。<br>担当者より2〜3営業日以内にご連絡いたします。</p>

      <div class="inquiry-details">
        <p style="margin-top: 0;"><strong>お問い合わせ内容</strong></p>
        <p><strong>件名:</strong> ${escapedTitle}</p>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 15px 0;">
        <p style="white-space: pre-wrap;">${escapedMessage}</p>
      </div>

      <p style="font-size: 13px; color: #888;">※ 本メールは自動送信です。このメールへの返信はお受けできません。</p>

      <div class="footer">
        <p style="margin: 0;">LandBridge株式会社</p>
        <p style="margin: 5px 0;"><a href="mailto:sales@landbridge.co.jp">sales@landbridge.co.jp</a></p>
      </div>
    </div>
  </div>
</body>
</html>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send contact confirmation email:', emailError);
      }
    }

    return NextResponse.json({ ok: true, id: contactData?.id });
  } catch (error) {
    console.error('Contact submit error:', error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
