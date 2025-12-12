import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

// 遅延初期化（ビルド時にエラーを防ぐ）
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// セット商品から弁当数を計算
function calculateMealsFromDescription(description: string): number {
  // "ふとるめし3個セット" → 3, "ふとるめし6個セット" → 6, etc.
  const match = description.match(/(\d+)個セット/);
  if (match) {
    return parseInt(match[1], 10);
  }
  // "3種類×1個ずつ" → 3, "3種類×2個ずつ" → 6
  const multiMatch = description.match(/(\d+)種類×(\d+)個/);
  if (multiMatch) {
    return parseInt(multiMatch[1], 10) * parseInt(multiMatch[2], 10);
  }
  return 1;
}

async function getResendClient() {
  const { Resend } = await import('resend');
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

// Supabaseクライアント（遅延初期化）
function getSupabaseClient() {
  try {
    return createServerClient();
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripeClient();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  // 決済成功イベントを処理
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await handleSuccessfulPayment(session, stripe);
    } catch (error) {
      console.error('Error handling successful payment:', error);
      return NextResponse.json({ error: 'Error processing payment' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session, stripe: Stripe) {
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name;
  const customerPhone = session.customer_details?.phone;
  const customerAddress = session.customer_details?.address;
  const amountTotal = session.amount_total;

  if (!customerEmail) {
    console.error('No customer email found in session');
    return;
  }

  // 注文詳細を取得
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  // 注文内容を文字列に変換
  const menuSet = lineItems.data
    .map(item => `${item.description} × ${item.quantity}`)
    .join(', ');

  // 住所を文字列に変換
  const addressString = customerAddress
    ? [
        customerAddress.postal_code,
        customerAddress.state,
        customerAddress.city,
        customerAddress.line1,
        customerAddress.line2
      ].filter(Boolean).join(' ')
    : '';

  // 数量を計算（全商品の合計数量）
  const totalQuantity = lineItems.data.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // データベースに注文を保存
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error: dbError } = await (supabase
        .from('orders') as any)
        .insert({
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string || null,
          customer_name: customerName || 'お客様',
          customer_email: customerEmail,
          phone: customerPhone || '',
          address: addressString,
          menu_set: menuSet,
          quantity: totalQuantity,
          amount: amountTotal || 0,
          currency: session.currency || 'jpy',
          status: 'pending',
        });

      if (dbError) {
        console.error('Failed to save order to database:', dbError);
      } else {
        console.log('Order saved to database successfully');
      }
    } catch (error) {
      console.error('Error saving order to database:', error);
    }
  } else {
    console.error('Supabase client not available, order not saved to database');
  }

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

  // 在庫を減らす
  await reduceInventory(lineItems.data);

  console.log('Order confirmation email sent to:', customerEmail);
  console.log('Slack notification sent');
  console.log('Inventory reduced');
}

// 在庫を減らす関数
async function reduceInventory(items: Stripe.LineItem[]) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('Supabase client not available, inventory not reduced');
    return;
  }

  // 購入された商品から総弁当数を計算
  let totalMealsToReduce = 0;
  for (const item of items) {
    const description = item.description || '';
    const quantity = item.quantity || 1;
    const mealsPerItem = calculateMealsFromDescription(description);
    totalMealsToReduce += mealsPerItem * quantity;
  }

  if (totalMealsToReduce === 0) {
    console.log('No meals to reduce from inventory');
    return;
  }

  try {
    // 全ての有効なメニューアイテムを取得
    const { data: menuItems, error: fetchError } = await (supabase
      .from('menu_items') as any)
      .select('id, name, stock')
      .eq('is_active', true)
      .gt('stock', 0);

    if (fetchError) {
      console.error('Failed to fetch menu items:', fetchError);
      return;
    }

    if (!menuItems || menuItems.length === 0) {
      console.error('No active menu items found');
      return;
    }

    // 各メニューアイテムから均等に在庫を減らす
    // 3種類のセットなので、1セットにつき各弁当1個ずつ減らす
    const reductionPerItem = Math.ceil(totalMealsToReduce / menuItems.length);

    for (const menuItem of menuItems as any[]) {
      const newStock = Math.max(0, menuItem.stock - reductionPerItem);

      const { error: updateError } = await (supabase
        .from('menu_items') as any)
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', menuItem.id);

      if (updateError) {
        console.error(`Failed to update stock for ${menuItem.name}:`, updateError);
      } else {
        console.log(`Stock updated for ${menuItem.name}: ${menuItem.stock} -> ${newStock}`);
      }
    }
  } catch (error) {
    console.error('Error reducing inventory:', error);
  }
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

  const resend = await getResendClient();
  if (!resend) {
    console.error('RESEND_API_KEY is not set, skipping email');
    return;
  }

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

  const { error } = await resend.emails.send({
    from: 'ふとるめし <noreply@resend.dev>',
    to: email,
    subject: '【ふとるめし】ご注文ありがとうございます',
    html: emailHtml,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
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
