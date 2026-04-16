import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { isPromoterBlockArray } from '@/lib/types/promoter';

function getClient(supabase: ReturnType<typeof createServerClient>) {
  return supabase as unknown as { from: (table: string) => any };
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/.test(slug) || /^[a-z0-9]$/.test(slug);
}

export async function GET() {
  try {
    const client = getClient(createServerClient());
    const result = await client
      .from('promoter_pages')
      .select('*')
      .order('created_at', { ascending: false });

    if (result.error) {
      return NextResponse.json({ error: 'Failed to fetch promoter pages' }, { status: 500 });
    }
    return NextResponse.json(result.data || []);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, referrer_id, title, blocks, is_active } = body ?? {};

    if (typeof slug !== 'string' || !isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'slug は半角英数とハイフンのみ、1〜64文字で入力してください' },
        { status: 400 }
      );
    }

    if (blocks !== undefined && !isPromoterBlockArray(blocks)) {
      return NextResponse.json({ error: 'blocks の形式が不正です' }, { status: 400 });
    }

    const client = getClient(createServerClient());

    const existing = await client
      .from('promoter_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existing.data) {
      return NextResponse.json({ error: 'この slug は既に使用されています' }, { status: 400 });
    }

    const result = await client
      .from('promoter_pages')
      .insert({
        slug,
        referrer_id: referrer_id || null,
        title: title?.trim() || null,
        blocks: blocks ?? [],
        is_active: is_active !== false,
      })
      .select()
      .single();

    if (result.error) {
      return NextResponse.json({ error: 'Failed to create promoter page' }, { status: 500 });
    }
    return NextResponse.json(result.data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
