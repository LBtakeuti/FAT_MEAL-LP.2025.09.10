import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

const resend = new Resend(process.env.RESEND_API_KEY);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // 決済成功イベントを処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await handleSuccessfulPayment(session);
    } catch (error) {
      console.error('Error handling successful payment:', error);
      return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const amountTotal = session.amount_total;

  if (!customerEmail) {
    console.error('No customer email found in session');
    return;
  }

  // 注文詳細を取得
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  // メール送信
  await sendOrderConfirmationEmail({
    email: customerEmail,
    name: customerName || 'お客様',
    orderId: session.id,
    amount: amountTotal || 0,
    items: lineItems.data,
  });

  // Slack通知
  await sendSlackNotification({
    customerName: customerName || 'お客様',
    customerEmail: customerEmail,
    orderId: session.id,
    amount: amountTotal || 0,
    items: lineItems.data,
  });

  console.log('Order confirmation email sent to:', customerEmail);
  console.log('Slack notification sent');
}

interface OrderEmailParams {
  email: string;
  name: string;
  orderId: string;
  amount: number;
  items: Stripe.LineItem[];
}

async function sendOrderConfirmationEmail(params: OrderEmailParams) {
  const { email, name, orderId, amount, items } = params;

  const itemsList = items
    .map(item => `・${item.description} × ${item.quantity}`)
    .join('\n');

  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e5e5; }
    .order-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .total { font-size: 24px; color: #f97316; font-weight: bold; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ご注文ありがとうございます</h1>
    </div>
    <div class="content">
      <p>${name} 様</p>
      <p>この度は「ふとるめし」をご注文いただき、誠にありがとうございます。</p>
      <p>ご注文内容を確認させていただきました。商品の発送準備ができ次第、改めてご連絡いたします。</p>

      <div class="order-details">
        <h3 style="margin-top: 0;">ご注文内容</h3>
        <p><strong>注文番号:</strong> ${orderId.slice(-8).toUpperCase()}</p>
        <pre style="font-family: inherit; white-space: pre-wrap;">${itemsList}</pre>
        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 15px 0;">
        <p style="margin-bottom: 0;"><strong>合計金額:</strong> <span class="total">${formattedAmount}</span></p>
      </div>

      <p>ご不明な点がございましたら、お気軽にお問い合わせください。</p>

      <p style="margin-top: 30px;">
        今後とも「ふとるめし」をよろしくお願いいたします。
      </p>
    </div>
    <div class="footer">
      <p>ふとるめし - 太りたいあなたのための高カロリー弁当</p>
      <p>© 2025 ふとるめし All Rights Reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  const { data, error } = await resend.emails.send({
    from: 'ふとるめし <noreply@resend.dev>',
    to: email,
    subject: '【ふとるめし】ご注文ありがとうございます',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw error;
  }

  return data;
}

// Slack通知
interface SlackNotificationParams {
  customerName: string;
  customerEmail: string;
  orderId: string;
  amount: number;
  items: Stripe.LineItem[];
}

async function sendSlackNotification(params: SlackNotificationParams) {
  const { customerName, customerEmail, orderId, amount, items } = params;

  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    console.error('SLACK_WEBHOOK_URL is not set');
    return;
  }

  const formattedAmount = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);

  const itemsList = items
    .map(item => `• ${item.description} × ${item.quantity}`)
    .join('\n');

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 新規注文が入りました！',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*お客様名:*\n${customerName}`,
          },
          {
            type: 'mrkdwn',
            text: `*メール:*\n${customerEmail}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*注文番号:*\n${orderId.slice(-8).toUpperCase()}`,
          },
          {
            type: 'mrkdwn',
            text: `*合計金額:*\n${formattedAmount}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*注文内容:*\n${itemsList}`,
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
            text: `📅 ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
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
      console.error('Failed to send Slack notification:', response.statusText);
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}
