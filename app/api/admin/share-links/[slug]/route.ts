import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonBadRequest,
  jsonNotFound,
  jsonError,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';
import { isValidShareLinkSlug, normalizeManualSlug } from '@/lib/share-link-slug';
import { SHARE_PHOTO_BUCKET, getSharePhotoUrl } from '@/lib/share-storage';
import {
  sanitizeShareLinkBody,
  normalizeExpiresAt,
  normalizeTitle,
  normalizeLabel,
} from '@/lib/share-link-validation';

// GET: 共有リンク詳細（リンク + 写真一覧）
export const GET = withAuthDynamic(async (_request: NextRequest, context) => {
  const { slug } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const supabase = createServerClient() as any;

  const { data: link, error: linkErr } = await supabase
    .from('share_links')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (linkErr) return handleSupabaseError(linkErr, '共有リンク取得');
  if (!link) return jsonNotFound('共有リンクが見つかりません');

  const { data: photos, error: photosErr } = await supabase
    .from('photos')
    .select('*')
    .eq('share_link_id', link.id)
    .order('sort_order', { ascending: true });

  if (photosErr) return handleSupabaseError(photosErr, '写真取得');

  const photosWithUrl = ((photos || []) as Array<{ file_path: string }>).map((p) => ({
    ...p,
    url: getSharePhotoUrl(supabase, p.file_path),
  }));

  return jsonSuccess({ link, photos: photosWithUrl });
});

// PUT: 共有リンクのメッセージ・ラベル・期限を更新
export const PUT = withAuthDynamic(async (request: NextRequest, context) => {
  const { slug } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const body = await request.json().catch(() => ({}));
  const validation = validateBody(body, {
    label: { type: 'string', max: 120 },
    title: { type: 'string', max: 120 },
  });
  if (!validation.valid) return jsonBadRequest(validation.errors.join(', '));

  const expiresAt = normalizeExpiresAt(body.expires_at);
  if (!expiresAt.ok) return jsonBadRequest(expiresAt.message);

  const supabase = createServerClient() as any;

  const { data: existing, error: getErr } = await supabase
    .from('share_links')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();
  if (getErr) return handleSupabaseError(getErr, '共有リンク取得');
  if (!existing) return jsonNotFound('共有リンクが見つかりません');

  // 管理者指定 slug の変更を受け付ける（変更時のみ unique check）
  const updates: Record<string, unknown> = {
    label: normalizeLabel(body.label),
    title: normalizeTitle(body.title),
    body_html: sanitizeShareLinkBody(body.body_html),
    expires_at: expiresAt.value,
  };

  const desiredSlug = normalizeManualSlug(body.slug);
  if (desiredSlug !== null && desiredSlug !== existing.slug) {
    if (!isValidShareLinkSlug(desiredSlug)) {
      return jsonBadRequest('URLスラッグは英数字とハイフンのみ・6〜64文字で指定してください');
    }
    updates.slug = desiredSlug;
  }

  const { data, error } = await supabase
    .from('share_links')
    .update(updates)
    .eq('id', existing.id)
    .select('id, slug, label, title, body_html, expires_at, created_at')
    .single();

  if (error) {
    if ((error as any).code === '23505') {
      return jsonError(`URLスラッグ "${desiredSlug}" は既に使用されています`, 409);
    }
    return handleSupabaseError(error, '共有リンク更新');
  }
  return jsonSuccess(data);
});

// DELETE: 共有リンク削除（写真ファイルとログも削除）
export const DELETE = withAuthDynamic(async (_request: NextRequest, context) => {
  const { slug } = await context.params;
  if (!isValidShareLinkSlug(slug)) return jsonBadRequest('slug の形式が不正です');

  const supabase = createServerClient() as any;

  const { data: link, error: linkErr } = await supabase
    .from('share_links')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (linkErr) return handleSupabaseError(linkErr, '共有リンク取得');
  if (!link) return jsonNotFound('共有リンクが見つかりません');

  const { data: photos } = await supabase
    .from('photos')
    .select('file_path')
    .eq('share_link_id', link.id);

  const filePaths = ((photos || []) as Array<{ file_path: string }>).map((p) => p.file_path);

  if (filePaths.length > 0) {
    const { error: removeErr } = await supabase.storage.from(SHARE_PHOTO_BUCKET).remove(filePaths);
    if (removeErr) {
      console.error('Storage 削除エラー（孤児ファイル化リスクあり）:', removeErr);
    }
  }

  const { error: delErr } = await supabase.from('share_links').delete().eq('id', link.id);
  if (delErr) return handleSupabaseError(delErr, '共有リンク削除');

  return jsonSuccess({ ok: true });
});
