import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * F14-1: コラム記事一覧 API（公開）
 *
 * クエリ:
 *   - limit: 取得件数（既定 12、最大 50）
 *   - offset: ページネーション用オフセット（既定 0）
 *   - tag: タグで絞り込み（例: ?tag=太りたい）
 *
 * 返却: { items: Article[], total: number }
 *   - is_published = true のレコードのみ
 *   - published_at DESC ソート
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient() as any;
    const { searchParams } = new URL(request.url);

    const limitRaw = parseInt(searchParams.get('limit') || '12', 10);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 12), 50);
    const offsetRaw = parseInt(searchParams.get('offset') || '0', 10);
    const offset = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);
    const tag = searchParams.get('tag');

    let query = supabase
      .from('articles')
      .select(
        'id, slug, title, excerpt, thumbnail_url, tags, author, published_at',
        { count: 'exact' },
      )
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (tag) {
      // tags は text[] のため contains で完全一致絞り込み
      query = query.contains('tags', [tag]);
    }

    const { data, count, error } = await query;
    if (error) {
      console.error('[blog/list] supabase error', error);
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [], total: count ?? 0 });
  } catch (error) {
    console.error('[blog/list] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
