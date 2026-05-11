/**
 * Slack 通知の共通送信関数。
 *
 * 現状は SLACK_WEBHOOK_URL 1本に全種別を送る運用だが、メッセージ先頭に種別タグを差し込んで
 * 受信側で目視区別できるようにする。将来チャンネル分離する際は本ファイルだけ差し替えれば良い。
 */

export type SlackChannel = 'sales' | 'ops' | 'alert';

const CHANNEL_TAG: Record<SlackChannel, string> = {
  sales: '📊 [sales]',
  ops: '🚚 [ops]',
  alert: '🚨 [alert]',
};

interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

/**
 * Slack に Block Kit メッセージを投稿する。
 * blocks の先頭に種別タグの context ブロックを差し込む。
 *
 * SLACK_WEBHOOK_URL が未設定の場合は console.warn して何もしない（=既存挙動と同じ）。
 * 送信失敗は console.error してスローしない（呼び出し元の処理を止めない）。
 */
export async function postSlack(channel: SlackChannel, blocks: SlackBlock[]): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(`[slack:${channel}] SLACK_WEBHOOK_URL is not set`);
    return { ok: false, reason: 'SLACK_WEBHOOK_URL not set' };
  }

  const taggedBlocks: SlackBlock[] = [
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: CHANNEL_TAG[channel] }],
    },
    ...blocks,
  ];

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: taggedBlocks }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[slack:${channel}] failed status=${res.status} body=${text}`);
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (error) {
    console.error(`[slack:${channel}] error`, error);
    return { ok: false, reason: error instanceof Error ? error.message : 'unknown' };
  }
}

/**
 * 旧 attachments 形式（contact submit が使用）も同じタグ付けで送れるようにするヘルパー。
 * blocks 形式に統一する余地はあるが、当面の互換維持用。
 */
export async function postSlackAttachments(
  channel: SlackChannel,
  text: string,
  attachments: unknown[],
): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn(`[slack:${channel}] SLACK_WEBHOOK_URL is not set`);
    return { ok: false, reason: 'SLACK_WEBHOOK_URL not set' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${CHANNEL_TAG[channel]} ${text}`,
        attachments,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[slack:${channel}] failed status=${res.status} body=${body}`);
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (error) {
    console.error(`[slack:${channel}] error`, error);
    return { ok: false, reason: error instanceof Error ? error.message : 'unknown' };
  }
}
