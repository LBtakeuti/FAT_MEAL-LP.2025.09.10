import { NextRequest } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonNotFound,
  jsonBadRequest,
  jsonError,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/;

// GET: 個別メッセージ詳細
export const GET = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('individual_messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return jsonNotFound('個別メッセージが見つかりません');
  return jsonSuccess(data);
});

// PUT: 更新
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { id } = await context.params;
  const body = await request.json();

  const validation = validateBody(body, {
    slug: { required: true, type: 'string', max: 64 },
    title: { required: true, type: 'string', max: 120 },
  });
  if (!validation.valid) return jsonBadRequest(validation.errors.join(', '));

  if (!SLUG_PATTERN.test(body.slug)) {
    return jsonBadRequest('スラグは半角英数字とハイフンのみ使用できます（2〜64文字、先頭末尾は英数字）');
  }

  const images = Array.isArray(body.images) ? body.images.filter((u: unknown) => typeof u === 'string') : [];
  const sanitizedBody = sanitizeHtml(body.body_html || '', {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  });

  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('individual_messages')
    .update({
      slug: body.slug,
      title: body.title,
      body_html: sanitizedBody,
      images,
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    if ((error as any)?.code === '23505') {
      return jsonError('そのスラグは既に使用されています', 409);
    }
    return handleSupabaseError(error || { message: 'Not found' }, '個別メッセージ更新');
  }
  return jsonSuccess(data);
});

// DELETE: 削除
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { id } = await context.params;
  const supabase = createServerClient() as any;
  const { error } = await supabase.from('individual_messages').delete().eq('id', id);

  if (error) return handleSupabaseError(error, '個別メッセージ削除');
  return jsonSuccess({ message: '削除しました' });
});
