import { NextRequest } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  jsonBadRequest,
  jsonError,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/;

// GET: 個別メッセージ一覧（全件）
export const GET = withAuth(async () => {
  const supabase = createServerClient() as any;
  const { data, error } = await supabase
    .from('individual_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return handleSupabaseError(error, '個別メッセージ取得');
  return jsonSuccess(data || []);
});

// POST: 新規作成
export const POST = withAuth(async (request: NextRequest) => {
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
    .insert({
      slug: body.slug,
      title: body.title,
      body_html: sanitizedBody,
      images,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    if ((error as any).code === '23505') {
      return jsonError('そのスラグは既に使用されています', 409);
    }
    return handleSupabaseError(error, '個別メッセージ作成');
  }

  return jsonSuccess(data, 201);
});
