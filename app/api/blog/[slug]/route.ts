import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * F14-1: コラム記事詳細 API（公開）
 *
 * - slug 一致 + is_published = true の記事を返す
 * - view_count を 1 増やす（fire-and-forget、失敗してもレスポンスには影響させない）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    const supabase = createServerClient() as any;

    const { data: article, error } = await supabase
      .from('articles')
      .select(
        'id, slug, title, excerpt, content, thumbnail_url, tags, author, ' +
          'meta_title, meta_description, og_image_url, published_at, view_count',
      )
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error) {
      console.error('[blog/[slug]] supabase error', error);
      return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    }
    if (!article) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // view_count を 1 増やす（fire-and-forget）
    void supabase
      .from('articles')
      .update({ view_count: (article.view_count ?? 0) + 1 })
      .eq('id', article.id)
      .then(({ error: updateErr }: { error: unknown }) => {
        if (updateErr) console.error('[blog/[slug]] view_count update failed', updateErr);
      });

    return NextResponse.json(article);
  } catch (error) {
    console.error('[blog/[slug]] error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
