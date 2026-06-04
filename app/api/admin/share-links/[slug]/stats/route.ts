import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  withAuthDynamic,
  jsonSuccess,
  jsonBadRequest,
  jsonNotFound,
  handleSupabaseError,
} from '@/lib/api-helpers';
import { isValidShareLinkSlug } from '@/lib/share-link-slug';

// F26: JST 基準で YYYY-MM-DD を返す
const JST_OFFSET = 9 * 60 * 60 * 1000;
function toJstDateKey(iso: string): string {
  return new Date(new Date(iso).getTime() + JST_OFFSET).toISOString().slice(0, 10);
}
function jstDateKey(d: Date): string {
  return new Date(d.getTime() + JST_OFFSET).toISOString().slice(0, 10);
}

// GET: 共有リンクの統計（過去30日の日別アクセス・ダウンロード、JST 基準）
export const GET = withAuthDynamic(async (_request: NextRequest, context) => {
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

  const now = new Date();
  const from = new Date(now);
  from.setUTCDate(from.getUTCDate() - 30);

  const [accessRes, downloadRes] = await Promise.all([
    supabase
      .from('share_access_logs')
      .select('accessed_at, ip_address')
      .eq('share_link_id', link.id)
      .gte('accessed_at', from.toISOString()),
    supabase
      .from('share_download_logs')
      .select('downloaded_at, download_type')
      .eq('share_link_id', link.id)
      .gte('downloaded_at', from.toISOString()),
  ]);

  if (accessRes.error) return handleSupabaseError(accessRes.error, 'アクセスログ取得');
  if (downloadRes.error) return handleSupabaseError(downloadRes.error, 'ダウンロードログ取得');

  const accesses = (accessRes.data || []) as Array<{ accessed_at: string; ip_address: string | null }>;
  const downloads = (downloadRes.data || []) as Array<{ downloaded_at: string; download_type: string }>;

  const ips = new Set<string>();
  const accessByDate = new Map<string, number>();
  for (const a of accesses) {
    if (a.ip_address) ips.add(a.ip_address);
    const date = toJstDateKey(a.accessed_at);
    accessByDate.set(date, (accessByDate.get(date) || 0) + 1);
  }

  const downloadByDate = new Map<string, number>();
  let singleDownloads = 0;
  let zipDownloads = 0;
  for (const d of downloads) {
    if (d.download_type === 'single') singleDownloads += 1;
    if (d.download_type === 'zip') zipDownloads += 1;
    const date = toJstDateKey(d.downloaded_at);
    downloadByDate.set(date, (downloadByDate.get(date) || 0) + 1);
  }

  // 過去30日をゼロ埋めで返す（JST基準）
  const daily_access: Array<{ date: string; count: number }> = [];
  const daily_downloads: Array<{ date: string; count: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const date = jstDateKey(d);
    daily_access.push({ date, count: accessByDate.get(date) || 0 });
    daily_downloads.push({ date, count: downloadByDate.get(date) || 0 });
  }

  return jsonSuccess({
    total_access: accesses.length,
    unique_access: ips.size,
    total_downloads: downloads.length,
    single_downloads: singleDownloads,
    zip_downloads: zipDownloads,
    daily_access,
    daily_downloads,
  });
});
