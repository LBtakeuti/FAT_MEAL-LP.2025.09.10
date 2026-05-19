import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuth,
  jsonSuccess,
  jsonBadRequest,
  jsonError,
  handleSupabaseError,
  validateBody,
} from '@/lib/api-helpers';
import { generateShareLinkSlug, isValidShareLinkSlug, normalizeManualSlug } from '@/lib/share-link-slug';
import {
  sanitizeShareLinkBody,
  normalizeExpiresAt,
  normalizeTitle,
  normalizeLabel,
} from '@/lib/share-link-validation';

// GET: 共有リンク一覧（集計付き）
export const GET = withAuth(async () => {
  const supabase = createServerClient() as any;

  const { data: links, error } = await supabase
    .from('share_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return handleSupabaseError(error, '共有リンク取得');

  const linksList = (links || []) as Array<{ id: string }>;
  if (linksList.length === 0) return jsonSuccess([]);

  const linkIds = linksList.map((l) => l.id);

  const [photosRes, accessesRes, downloadsRes, conversionsRes] = await Promise.all([
    supabase.from('photos').select('share_link_id').in('share_link_id', linkIds),
    supabase.from('share_access_logs').select('share_link_id, ip_address').in('share_link_id', linkIds),
    supabase.from('share_download_logs').select('share_link_id').in('share_link_id', linkIds),
    // 初回購入のみカウント（recurring は重複扱い）
    supabase
      .from('share_link_conversions')
      .select('share_link_id')
      .in('share_link_id', linkIds)
      .in('source_type', ['order', 'subscription_initial']),
  ]);

  const photoCounts = new Map<string, number>();
  for (const p of (photosRes.data || []) as Array<{ share_link_id: string }>) {
    photoCounts.set(p.share_link_id, (photoCounts.get(p.share_link_id) || 0) + 1);
  }

  const accessByLink = new Map<string, { total: number; ips: Set<string> }>();
  for (const a of (accessesRes.data || []) as Array<{ share_link_id: string; ip_address: string | null }>) {
    let bucket = accessByLink.get(a.share_link_id);
    if (!bucket) {
      bucket = { total: 0, ips: new Set() };
      accessByLink.set(a.share_link_id, bucket);
    }
    bucket.total += 1;
    if (a.ip_address) bucket.ips.add(a.ip_address);
  }

  const downloadCounts = new Map<string, number>();
  for (const d of (downloadsRes.data || []) as Array<{ share_link_id: string }>) {
    downloadCounts.set(d.share_link_id, (downloadCounts.get(d.share_link_id) || 0) + 1);
  }

  const conversionCounts = new Map<string, number>();
  for (const c of (conversionsRes.data || []) as Array<{ share_link_id: string }>) {
    conversionCounts.set(c.share_link_id, (conversionCounts.get(c.share_link_id) || 0) + 1);
  }

  const enriched = linksList.map((link) => {
    const acc = accessByLink.get(link.id);
    return {
      ...link,
      photo_count: photoCounts.get(link.id) || 0,
      access_count: acc?.total || 0,
      unique_access_count: acc?.ips.size || 0,
      download_count: downloadCounts.get(link.id) || 0,
      conversion_count: conversionCounts.get(link.id) || 0,
    };
  });

  return jsonSuccess(enriched);
});

// POST: 共有リンク新規作成
export const POST = withAuth(async (request: NextRequest) => {
  const body = await request.json();

  const validation = validateBody(body, {
    label: { type: 'string', max: 120 },
    title: { type: 'string', max: 120 },
  });
  if (!validation.valid) return jsonBadRequest(validation.errors.join(', '));

  const expiresAt = normalizeExpiresAt(body.expires_at);
  if (!expiresAt.ok) return jsonBadRequest(expiresAt.message);

  const payload = {
    label: normalizeLabel(body.label),
    title: normalizeTitle(body.title),
    body_html: sanitizeShareLinkBody(body.body_html),
    expires_at: expiresAt.value,
  };

  const supabase = createServerClient() as any;

  // 管理者指定 slug が来たらそれを優先（バリデーション＋重複チェック）
  const manualSlug = normalizeManualSlug(body.slug);
  if (manualSlug !== null) {
    if (!isValidShareLinkSlug(manualSlug)) {
      return jsonBadRequest('URLスラッグは英数字とハイフンのみ・6〜64文字で指定してください');
    }
    const { data, error } = await supabase
      .from('share_links')
      .insert({ slug: manualSlug, ...payload })
      .select('id, slug, label, title, body_html, expires_at, created_at')
      .single();
    if (error) {
      if ((error as any).code === '23505') {
        return jsonError(`URLスラッグ "${manualSlug}" は既に使用されています`, 409);
      }
      return handleSupabaseError(error, '共有リンク作成');
    }
    return jsonSuccess(data, 201);
  }

  // 自動生成（CSPRNG）。重複したら最大5回リトライ
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateShareLinkSlug();
    const { data, error } = await supabase
      .from('share_links')
      .insert({ slug, ...payload })
      .select('id, slug, label, title, body_html, expires_at, created_at')
      .single();

    if (!error) return jsonSuccess(data, 201);
    if ((error as any).code !== '23505') return handleSupabaseError(error, '共有リンク作成');
  }

  return jsonError('slug の生成に失敗しました。もう一度お試しください', 500);
});
