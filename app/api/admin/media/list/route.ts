/**
 * F51-3: メディアライブラリ一覧 API
 * Supabase Storage の `images` バケット直下のファイル一覧を返す。
 */
import { createServerClient } from '@/lib/supabase';
import { withAuth, jsonSuccess, jsonError } from '@/lib/api-helpers';

const BUCKET = 'images';

export const GET = withAuth(async (request) => {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const limitRaw = parseInt(searchParams.get('limit') || '100', 10);
  const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 100), 500);
  const offsetRaw = parseInt(searchParams.get('offset') || '0', 10);
  const offset = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);

  const { data: list, error } = await supabase.storage.from(BUCKET).list('', {
    limit,
    offset,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    console.error('[media/list] supabase storage list error:', error);
    return jsonError('メディア一覧の取得に失敗しました', 500, error);
  }

  // 各ファイルの公開URLを取得
  const items = (list ?? [])
    // ディレクトリやプレースホルダーは除外（id がないものはディレクトリ）
    .filter((f) => f.id !== null && f.name && f.name !== '.emptyFolderPlaceholder')
    .map((f) => {
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(f.name);
      return {
        name: f.name,
        url: pub.publicUrl,
        size: (f.metadata as any)?.size ?? null,
        mimetype: (f.metadata as any)?.mimetype ?? null,
        created_at: f.created_at ?? null,
        updated_at: f.updated_at ?? null,
      };
    });

  return jsonSuccess({ items, total: items.length });
});
