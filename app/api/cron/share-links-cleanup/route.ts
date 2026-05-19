import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { SHARE_PHOTO_BUCKET } from '@/lib/share-storage';

/**
 * 期限切れ共有リンクのクリーンアップCron。
 * `share_links.expires_at < NOW()` のレコードに紐づく Storage ファイルと
 * DB 行を削除する。photos / share_access_logs / share_download_logs は
 * ON DELETE CASCADE で自動削除される。
 *
 * 認証: Authorization: Bearer ${CRON_SECRET}
 * 実行: Vercel Cron（vercel.json で 1日1回スケジュール）
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1';
  const supabase = createServerClient() as any;
  const nowIso = new Date().toISOString();

  // 期限切れの share_links を取得
  const { data: expiredLinks, error: fetchErr } = await supabase
    .from('share_links')
    .select('id, slug, label, expires_at')
    .not('expires_at', 'is', null)
    .lt('expires_at', nowIso);

  if (fetchErr) {
    console.error('[cleanup] fetch error:', fetchErr);
    return NextResponse.json({ error: '共有リンク取得失敗', detail: fetchErr.message }, { status: 500 });
  }

  const links = (expiredLinks || []) as Array<{ id: string; slug: string; label: string | null; expires_at: string }>;

  if (links.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0, message: '期限切れレコードなし' });
  }

  const summary: Array<{
    slug: string;
    label: string | null;
    photo_count: number;
    storage_removed: number;
    db_deleted: boolean;
    error?: string;
  }> = [];

  for (const link of links) {
    const linkSummary: typeof summary[number] = {
      slug: link.slug,
      label: link.label,
      photo_count: 0,
      storage_removed: 0,
      db_deleted: false,
    };

    // 関連写真ファイルのパス収集
    const { data: photos } = await supabase
      .from('photos')
      .select('file_path')
      .eq('share_link_id', link.id);
    const filePaths = ((photos || []) as Array<{ file_path: string }>).map((p) => p.file_path);
    linkSummary.photo_count = filePaths.length;

    if (dryRun) {
      summary.push(linkSummary);
      continue;
    }

    // Storage から削除（バッチ。最大1000件単位）
    if (filePaths.length > 0) {
      const { data: removed, error: removeErr } = await supabase.storage
        .from(SHARE_PHOTO_BUCKET)
        .remove(filePaths);
      if (removeErr) {
        console.error(`[cleanup] storage remove error for ${link.slug}:`, removeErr);
        linkSummary.error = `storage削除エラー: ${removeErr.message}`;
      } else {
        linkSummary.storage_removed = Array.isArray(removed) ? removed.length : filePaths.length;
      }
    }

    // DB 削除（cascade）
    const { error: delErr } = await supabase.from('share_links').delete().eq('id', link.id);
    if (delErr) {
      console.error(`[cleanup] db delete error for ${link.slug}:`, delErr);
      linkSummary.error = `${linkSummary.error ? linkSummary.error + ' / ' : ''}DB削除エラー: ${delErr.message}`;
    } else {
      linkSummary.db_deleted = true;
    }

    summary.push(linkSummary);
  }

  console.log('[cleanup] result:', JSON.stringify(summary));

  return NextResponse.json({
    ok: true,
    dry_run: dryRun,
    deleted: summary.filter((s) => s.db_deleted).length,
    total_photos_removed: summary.reduce((acc, s) => acc + s.storage_removed, 0),
    detail: summary,
  });
}
