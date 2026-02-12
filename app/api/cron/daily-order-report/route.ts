import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Resend } from 'resend';

export const maxDuration = 60; // Vercelの最大実行時間

// Order型を定義
interface Order {
  id: string;
  order_number: number;
  customer_name: string;
  customer_name_kana: string;
  customer_email: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_detail: string;
  building: string;
  address: string;
  menu_set: string;
  quantity: number;
  amount: number;
  status: string;
  created_at: string;
}

// Subscription型を定義
interface NewSubscription {
  id: string;
  plan_name: string;
  plan_id: string;
  monthly_total_amount: number;
  deliveries_per_month: number;
  meals_per_delivery: number;
  shipping_address: {
    name?: string;
    email?: string;
    phone?: string;
    postal_code?: string;
    prefecture?: string;
    city?: string;
    address_detail?: string;
    building?: string;
  };
  started_at: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  // Cronジョブの認証（セキュリティのため）
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  console.log('[Cron Job] Starting daily order report...');
  console.log('[Cron Job] Authorization header present:', !!authHeader);
  console.log('[Cron Job] CRON_SECRET set:', !!cronSecret);
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[Cron Job] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[Cron Job] RESEND_API_KEY is not set');
      throw new Error('RESEND_API_KEY is not set');
    }
    console.log('[Cron Job] RESEND_API_KEY is set:', resendApiKey.substring(0, 10) + '...');

    const resend = new Resend(resendApiKey);
    const supabase = createServerClient();

    // 今日の日付を取得（JST 0:00〜23:59:59）
    // JST = UTC+9 なので、JST 0:00 = UTC 前日15:00、JST 23:59:59 = UTC 当日14:59:59
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000; // 9時間（ミリ秒）

    // 現在時刻をJSTに変換して日付を取得
    const jstNow = new Date(now.getTime() + jstOffset);
    const jstYear = jstNow.getUTCFullYear();
    const jstMonth = jstNow.getUTCMonth();
    const jstDate = jstNow.getUTCDate();

    // JST今日の0:00:00をUTCに変換（JST 0:00 = UTC -9時間 = 前日15:00）
    const todayStartUTC = new Date(Date.UTC(jstYear, jstMonth, jstDate) - jstOffset);
    // JST明日の0:00:00をUTCに変換
    const tomorrowStartUTC = new Date(Date.UTC(jstYear, jstMonth, jstDate + 1) - jstOffset);

    console.log('[Cron Job] JST Date:', `${jstYear}-${jstMonth + 1}-${jstDate}`);
    console.log('[Cron Job] Fetching orders from:', todayStartUTC.toISOString(), 'to:', tomorrowStartUTC.toISOString());

    // 今日の注文を取得（JST 0:00〜23:59:59）
    const { data: orders, error } = await (supabase
      .from('orders') as any)
      .select('*')
      .gte('created_at', todayStartUTC.toISOString())
      .lt('created_at', tomorrowStartUTC.toISOString())
      .order('created_at', { ascending: true }) as { data: Order[] | null; error: any };

    if (error) {
      console.error('[Cron Job] Failed to fetch orders:', error);
      throw error;
    }

    const orderCount = orders?.length || 0;
    console.log('[Cron Job] Found orders:', orderCount);

    // 今日の新規サブスクリプション契約を取得
    const { data: newSubscriptions, error: subError } = await (supabase
      .from('subscriptions') as any)
      .select('id, plan_name, plan_id, monthly_total_amount, deliveries_per_month, meals_per_delivery, shipping_address, started_at, created_at')
      .gte('created_at', todayStartUTC.toISOString())
      .lt('created_at', tomorrowStartUTC.toISOString())
      .order('created_at', { ascending: true }) as { data: NewSubscription[] | null; error: any };

    if (subError) {
      console.error('[Cron Job] Failed to fetch new subscriptions:', subError);
      // サブスク取得失敗してもレポート自体は続行
    }

    const newSubCount = newSubscriptions?.length || 0;
    console.log('[Cron Job] Found new subscriptions:', newSubCount);
    
    // 送信先メールアドレスの取得（カンマ区切りで複数指定可能）
    // 例: VENDOR_EMAIL=sales@landbridge.co.jp,info@landbridge.co.jp,takeuchi@landbridge.co.jp
    const vendorEmailsEnv = process.env.VENDOR_EMAIL || '';
    const fallbackEmail = 'takeuchi@landbridge.co.jp'; // フォールバック用
    
    // カンマ区切りで分割し、空白を削除
    const recipientEmails = vendorEmailsEnv
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    // 送信先が設定されていない場合はフォールバックを使用
    const emailsToSend = recipientEmails.length > 0 ? recipientEmails : [fallbackEmail];
    
    console.log('[Cron Job] Sending email to:', emailsToSend.join(', '));
    
    // 認証済みドメインを使用（環境変数で設定可能、デフォルトは認証済みドメイン）
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'ふとるめし <noreply@futorumeshi.com>';
    console.log('[Cron Job] Using from email:', fromEmail);

    // JSTの日付文字列を生成
    const dateStr = `${jstYear}年${jstMonth + 1}月${jstDate}日`;

    // メール送信関数（複数の送信先に対応）
    const sendEmailToRecipients = async (subject: string, html: string, attachments?: Array<{ filename: string; content: string }>) => {
      const results = {
        success: [] as string[],
        failed: [] as Array<{ email: string; error: string }>,
      };

      // fromEmailを確実に使用（クロージャで参照）
      const emailFrom = fromEmail;
      console.log('[Cron Job] sendEmailToRecipients - Using from email:', emailFrom);

      for (const email of emailsToSend) {
        try {
          console.log(`[Cron Job] Attempting to send email from ${emailFrom} to ${email}`);
          const { error: emailError } = await resend.emails.send({
            from: emailFrom,
            to: email,
            subject,
            html,
            ...(attachments && { attachments }),
          });

          if (emailError) {
            console.error(`[Cron Job] Failed to send email to ${email}:`, JSON.stringify(emailError, null, 2));
            results.failed.push({ email, error: emailError.message || String(emailError) });
          } else {
            console.log(`[Cron Job] Email sent successfully to: ${email}`);
            results.success.push(email);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Cron Job] Error sending email to ${email}:`, errorMessage);
          results.failed.push({ email, error: errorMessage });
        }
      }

      return results;
    };

    if (orderCount === 0 && newSubCount === 0) {
      // 注文もサブスク新規契約もない場合のメール
      const noOrdersHtml = `
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
              .footer { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>本日の注文報告</h1>
              </div>
              <div class="content">
                <p>${dateStr}の注文・新規契約はありませんでした。</p>
                <p>ご確認のほどよろしくお願いいたします。</p>
              </div>
              <div class="footer">
                <p>ふとるめし - 太りたいあなたのための高カロリー弁当</p>
                <p>© 2025 ふとるめし All Rights Reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

      const emailResults = await sendEmailToRecipients(
        `【ふとるめし】${dateStr}の注文報告`,
        noOrdersHtml
      );

      // すべての送信先に失敗した場合のみエラー
      if (emailResults.success.length === 0) {
        throw new Error(`Failed to send email to all recipients: ${emailResults.failed.map(f => `${f.email} (${f.error})`).join(', ')}`);
      }

      return NextResponse.json({
        success: true,
        message: 'No orders email sent',
        orderCount: 0,
        newSubCount: 0,
        date: dateStr,
        emailResults: {
          sentTo: emailResults.success,
          failed: emailResults.failed
        }
      });
    }

    // CSVファイルを生成（注文がある場合のみ）
    const csvContent = orderCount > 0 ? generateCSV(orders || []) : null;
    const csvBuffer = csvContent ? Buffer.from(csvContent, 'utf-8') : null;

    // 注文サマリーを生成
    const totalAmount = orders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
    const totalQuantity = orders?.reduce((sum, order) => sum + (order.quantity || 0), 0) || 0;

    // サブスク新規契約セクションのHTML生成
    const subscriptionSectionHtml = newSubCount > 0 ? `
              <div style="margin-top: 30px; border-top: 2px solid #f97316; padding-top: 20px;">
                <h3 style="color: #f97316;">新規サブスクリプション契約（${newSubCount}件）</h3>
                ${newSubscriptions?.map(sub => `
                  <div style="border-bottom: 1px solid #e5e5e5; padding: 15px 0;">
                    <p><strong>お客様名:</strong> ${escapeHtml(sub.shipping_address?.name || 'お客様')}</p>
                    <p><strong>メール:</strong> ${escapeHtml(sub.shipping_address?.email || '')}</p>
                    <p><strong>プラン:</strong> ${escapeHtml(sub.plan_name)}</p>
                    <p><strong>月額:</strong> ¥${sub.monthly_total_amount.toLocaleString()}</p>
                    <p><strong>配送:</strong> 月${sub.deliveries_per_month}回（${sub.meals_per_delivery}食/回）</p>
                  </div>
                `).join('')}
              </div>` : '';

    // メール送信（CSVファイル添付）
    const ordersSectionHtml = orderCount > 0 ? `
              <p>${dateStr}の注文が<strong>${orderCount}件</strong>ございます。</p>
              ${csvContent ? '<p>詳細は添付のCSVファイルをご確認ください。</p>' : ''}

              <div class="summary">
                <h3 style="margin-top: 0;">注文サマリー</h3>
                <div class="summary-item">
                  <span class="summary-label">注文件数:</span>
                  <span class="summary-value">${orderCount}件</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">合計数量:</span>
                  <span class="summary-value">${totalQuantity}個</span>
                </div>
              </div>

              <div class="order-list">
                <h3>注文一覧</h3>
                ${orders?.slice(0, 10).map(order => `
                  <div class="order-item">
                    <p><strong>注文番号:</strong> ${order.order_number || order.id.slice(0, 8)}</p>
                    <p><strong>お客様名:</strong> ${escapeHtml(order.customer_name || '')}</p>
                    <p><strong>メニュー:</strong> ${escapeHtml(order.menu_set || '')}</p>
                    <p><strong>数量:</strong> ${order.quantity || 0}個</p>
                  </div>
                `).join('')}
                ${orderCount > 10 ? `<p style="color: #6b7280; font-size: 14px;">他 ${orderCount - 10}件の注文があります。詳細はCSVファイルをご確認ください。</p>` : ''}
              </div>` : `<p>${dateStr}の注文はありませんでした。</p>`;

    const orderReportHtml = `
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
            .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .summary-item { margin: 10px 0; }
            .summary-label { font-weight: bold; color: #6b7280; }
            .summary-value { font-size: 24px; color: #f97316; font-weight: bold; }
            .order-list { margin: 20px 0; }
            .order-item { border-bottom: 1px solid #e5e5e5; padding: 15px 0; }
            .order-item:last-child { border-bottom: none; }
            .footer { background: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>本日の注文報告</h1>
            </div>
            <div class="content">
              ${ordersSectionHtml}
              ${subscriptionSectionHtml}
            </div>
            <div class="footer">
              <p>ふとるめし - 太りたいあなたのための高カロリー弁当</p>
              <p>© 2025 ふとるめし All Rights Reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    // 件名を生成
    const subjectParts = [];
    if (orderCount > 0) subjectParts.push(`注文${orderCount}件`);
    if (newSubCount > 0) subjectParts.push(`新規サブスク${newSubCount}件`);
    const subjectDetail = subjectParts.length > 0 ? `（${subjectParts.join('・')}）` : '';

    // CSV添付（注文がある場合のみ）
    const attachments = csvBuffer ? [
      {
        filename: `orders_${jstYear}${String(jstMonth + 1).padStart(2, '0')}${String(jstDate).padStart(2, '0')}.csv`,
        content: csvBuffer.toString('base64'),
      },
    ] : undefined;

    const emailResults = await sendEmailToRecipients(
      `【ふとるめし】${dateStr}の注文報告${subjectDetail}`,
      orderReportHtml,
      attachments
    );

    // すべての送信先に失敗した場合のみエラー
    if (emailResults.success.length === 0) {
      throw new Error(`Failed to send email to all recipients: ${emailResults.failed.map(f => `${f.email} (${f.error})`).join(', ')}`);
    }

    console.log('[Cron Job] Order count:', orderCount, 'Total amount:', totalAmount);
    console.log('[Cron Job] Email sent successfully to:', emailResults.success.join(', '));
    if (emailResults.failed.length > 0) {
      console.warn('[Cron Job] Failed to send to:', emailResults.failed.map(f => f.email).join(', '));
    }

    // レポート送信成功後、注文ステータスを「連絡済み」に更新
    // order_received（注文受付）またはpending（旧ステータス）の注文のみ更新
    if (orders && orders.length > 0) {
      const orderIds = orders
        .filter(order => order.status === 'order_received' || order.status === 'pending')
        .map(order => order.id);

      if (orderIds.length > 0) {
        const { error: updateError } = await (supabase
          .from('orders') as any)
          .update({ status: 'notified', updated_at: new Date().toISOString() })
          .in('id', orderIds);

        if (updateError) {
          console.error('[Cron Job] Failed to update order status:', updateError);
        } else {
          console.log(`[Cron Job] Updated ${orderIds.length} orders to 'notified' status`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order report email sent',
      orderCount,
      newSubCount,
      totalAmount,
      totalQuantity,
      date: dateStr,
      emailResults: {
        sentTo: emailResults.success,
        failed: emailResults.failed
      }
    });
  } catch (error) {
    console.error('[Cron Job] Daily order report error:', error);
    console.error('[Cron Job] Error details:', error instanceof Error ? error.stack : String(error));
    return NextResponse.json(
      { 
        error: 'Failed to send daily order report', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// CSV生成関数（既存のexport-csv機能を参考）
function generateCSV(orders: Order[]): string {
  // CSVヘッダー
  const headers = [
    '氏名',
    'フリガナ',
    'メールアドレス',
    '電話番号',
    '住所',
    '注文内容',
    '数量',
    '金額',
    'ステータス',
    '注文日時（日本時間）'
  ];

  // CSVデータ行
  const rows = orders.map((order) => [
    order.customer_name || '',
    order.customer_name_kana || '',
    order.customer_email || '',
    order.phone || '',
    order.address || '',
    formatMenuSet(order.menu_set || ''),
    order.quantity || 0,
    order.amount || 0,
    translateStatus(order.status || 'pending'),
    formatDateTimeJST(order.created_at)
  ]);

  // CSV形式に変換（BOM付きUTF-8でエンコード）
  const bom = '\uFEFF';
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
  ].join('\n');

  return bom + csvContent;
}

// CSVエスケープ処理
function escapeCSV(value: string): string {
  if (!value) return '""';
  // カンマ、ダブルクォート、改行を含む場合はダブルクォートで囲む
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// HTMLエスケープ処理
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// メニューセットを見やすくフォーマット（カンマ区切り → 改行区切り）
function formatMenuSet(menuSet: string): string {
  if (!menuSet) return '';
  // カンマで分割して改行で結合（CSV内で見やすくする）
  return menuSet.split(',').map(item => item.trim()).join('\n');
}

// 日時をJSTでフォーマット
function formatDateTimeJST(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const jstOffset = 9 * 60 * 60 * 1000; // 9時間（ミリ秒）
  const jstDate = new Date(date.getTime() + jstOffset);

  const year = jstDate.getUTCFullYear();
  const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getUTCDate()).padStart(2, '0');
  const hours = String(jstDate.getUTCHours()).padStart(2, '0');
  const minutes = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(jstDate.getUTCSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// ステータスを日本語に翻訳
function translateStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'order_received': '注文受付',
    'notified': '連絡済み',
    'shipped': '発送済み',
    // 旧ステータス（互換性のため）
    'pending': '注文受付',
    'confirmed': '連絡済み',
    'delivered': '発送済み',
    'cancelled': 'キャンセル'
  };
  return statusMap[status] || status;
}

