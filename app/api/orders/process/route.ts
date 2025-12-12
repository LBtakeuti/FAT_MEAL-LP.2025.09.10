import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@/lib/supabase';

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

// セット商品から弁当数を計算
function calculateMealsFromDescription(description: string): number {
  const match = description.match(/(\d+)個セット/);
  if (match) {
    return parseInt(match[1], 10);
  }
  const multiMatch = description.match(/(\d+)種類×(\d+)個/);
  if (multiMatch) {
    return parseInt(multiMatch[1], 10) * parseInt(multiMatch[2], 10);
  }
  return 1;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, customerInfo } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const stripe = getStripeClient();

    // Stripeセッション情報を取得
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });

    // 既に処理済みかチェック
    const supabase = createServerClient();
    const { data: existingOrder } = await (supabase
      .from('orders') as any)
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existingOrder) {
      return NextResponse.json({ success: true, message: 'Order already processed' });
    }

    // 決済が完了しているかチェック
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const customerEmail = session.customer_details?.email || customerInfo?.email;
    const customerName = session.customer_details?.name ||
      (customerInfo ? `${customerInfo.lastName} ${customerInfo.firstName}` : 'お客様');
    const customerNameKana = customerInfo
      ? `${customerInfo.lastNameKana} ${customerInfo.firstNameKana}`
      : '';
    const customerPhone = session.customer_details?.phone || customerInfo?.phone;
    const customerAddress = session.customer_details?.address;
    const amountTotal = session.amount_total;

    // 注文詳細を取得
    const lineItems = session.line_items?.data || [];

    // 注文内容を文字列に変換
    const menuSet = lineItems
      .map(item => `${item.description} × ${item.quantity}`)
      .join(', ');

    // 住所を文字列に変換（フルアドレス）
    let addressString = '';
    if (customerAddress) {
      addressString = [
        customerAddress.postal_code,
        customerAddress.state,
        customerAddress.city,
        customerAddress.line1,
        customerAddress.line2
      ].filter(Boolean).join(' ');
    } else if (customerInfo) {
      addressString = [
        customerInfo.postalCode,
        customerInfo.prefecture,
        customerInfo.city,
        customerInfo.address,
        customerInfo.building
      ].filter(Boolean).join(' ');
    }

    // 個別の住所フィールド
    const postalCode = customerAddress?.postal_code || customerInfo?.postalCode || '';
    const prefecture = customerAddress?.state || customerInfo?.prefecture || '';
    const city = customerAddress?.city || customerInfo?.city || '';
    const addressDetail = customerAddress?.line1 || customerInfo?.address || '';
    const building = customerAddress?.line2 || customerInfo?.building || '';

    // 数量を計算
    const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // データベースに注文を保存
    const { error: dbError } = await (supabase
      .from('orders') as any)
      .insert({
        stripe_session_id: sessionId,
        stripe_payment_intent_id: session.payment_intent as string || null,
        customer_name: customerName,
        customer_name_kana: customerNameKana,
        customer_email: customerEmail,
        phone: customerPhone || '',
        postal_code: postalCode,
        prefecture: prefecture,
        city: city,
        address_detail: addressDetail,
        building: building,
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

    // 在庫を減らす
    await reduceInventory(lineItems, supabase);

    // Slack通知
    await sendSlackNotification({
      customerName,
      customerEmail: customerEmail || '',
      orderId: sessionId,
      amount: amountTotal || 0,
      items: lineItems,
    });

    return NextResponse.json({
      success: true,
      order: {
        customerName,
        email: customerEmail,
        amount: amountTotal,
        items: menuSet,
      }
    });
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}

// 在庫を減らす関数
async function reduceInventory(items: Stripe.LineItem[], supabase: ReturnType<typeof createServerClient>) {
  let totalMealsToReduce = 0;
  for (const item of items) {
    const description = item.description || '';
    const quantity = item.quantity || 1;
    const mealsPerItem = calculateMealsFromDescription(description);
    totalMealsToReduce += mealsPerItem * quantity;
  }

  if (totalMealsToReduce === 0) return;

  try {
    const { data: menuItems, error: fetchError } = await (supabase
      .from('menu_items') as any)
      .select('id, name, stock')
      .eq('is_active', true)
      .gt('stock', 0);

    if (fetchError || !menuItems || menuItems.length === 0) return;

    const reductionPerItem = Math.ceil(totalMealsToReduce / menuItems.length);

    for (const menuItem of menuItems as any[]) {
      const newStock = Math.max(0, menuItem.stock - reductionPerItem);
      await (supabase
        .from('menu_items') as any)
        .update({ stock: newStock, updated_at: new Date().toISOString() })
        .eq('id', menuItem.id);
    }
  } catch (error) {
    console.error('Error reducing inventory:', error);
  }
}

// Slack通知
async function sendSlackNotification(params: {
  customerName: string;
  customerEmail: string;
  orderId: string;
  amount: number;
  items: Stripe.LineItem[];
}) {
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
    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    console.log('Slack notification sent');
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}
