import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withAuth, jsonSuccess, jsonBadRequest, handleSupabaseError } from '@/lib/api-helpers';
import { parseTikTokShopCsv } from '@/lib/tiktok-shop-csv';

export const POST = withAuth(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return jsonBadRequest('CSVファイルが指定されていません');
  }

  const text = await file.text();
  const { rows, errors } = parseTikTokShopCsv(text);

  if (rows.length === 0) {
    return jsonBadRequest(
      errors.length > 0 ? `CSVの解析に失敗しました: ${errors.join(', ')}` : '取り込む行がありません'
    );
  }

  const supabase = createServerClient() as any;

  // tiktok_order_id をキーに upsert
  const { data, error } = await supabase
    .from('tiktok_shop_orders')
    .upsert(rows, { onConflict: 'tiktok_order_id' })
    .select('id');

  if (error) {
    return handleSupabaseError(error, 'TikTok Shop 注文の取込');
  }

  return jsonSuccess({
    imported: data?.length ?? 0,
    parsed: rows.length,
    warnings: errors,
  });
});
