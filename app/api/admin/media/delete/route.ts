/**
 * F51-3: メディアファイル削除 API
 * Supabase Storage の `images` バケット内のファイルを削除する。
 *
 * リクエスト body: { name: string }
 * - name はバケット内のファイル名（パス）
 * - 使用中の記事を参照しているかの警告は今回スコープ外（admin の責任で削除する）
 */
import { createServerClient } from '@/lib/supabase';
import { withAuth, jsonSuccess, jsonError } from '@/lib/api-helpers';

const BUCKET = 'images';

export const POST = withAuth(async (request) => {
  let body: { name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return jsonError('リクエスト形式が不正です', 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return jsonError('name は必須です', 400);
  }
  // パストラバーサル防止: ".." / 先頭 "/" を含むパスは拒否
  if (name.includes('..') || name.startsWith('/')) {
    return jsonError('不正なファイル名です', 400);
  }

  const supabase = createServerClient();
  const { error } = await supabase.storage.from(BUCKET).remove([name]);
  if (error) {
    console.error('[media/delete] supabase storage remove error:', error);
    return jsonError('削除に失敗しました', 500, error);
  }

  return jsonSuccess({ ok: true });
});
