import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withAuthDynamic, jsonSuccess, jsonBadRequest, jsonError } from '@/lib/api-helpers';

// YYYY-MM-DD 形式かを判定
function isYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const PATCH = withAuthDynamic(async (request: NextRequest, { params }) => {
  const { id } = await params;
  if (!id) return jsonBadRequest('id is required');

  const body = await request.json().catch(() => null);
  const source = body?.source as string | undefined;
  const preferredDate = body?.preferred_delivery_date;

  if (source !== 'subscription' && source !== 'order') {
    return jsonBadRequest('source は subscription または order を指定してください');
  }
  if (!isYmd(preferredDate)) {
    return jsonBadRequest('preferred_delivery_date は YYYY-MM-DD 形式で指定してください');
  }

  const supabase = createServerClient() as any;
  const table = source === 'subscription' ? 'subscription_deliveries' : 'orders';

  const { error } = await supabase
    .from(table)
    .update({
      preferred_delivery_date: preferredDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return jsonError('配送希望日の更新に失敗しました', 500, error);
  }

  return jsonSuccess({ id, source, preferred_delivery_date: preferredDate });
});
