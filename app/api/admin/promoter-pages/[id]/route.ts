import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { isPromoterBlockArray } from '@/lib/types/promoter';

function getClient(supabase: ReturnType<typeof createServerClient>) {
  return supabase as unknown as { from: (table: string) => any };
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/.test(slug) || /^[a-z0-9]$/.test(slug);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { slug, referrer_id, title, blocks, is_active } = body ?? {};

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (slug !== undefined) {
      if (typeof slug !== 'string' || !isValidSlug(slug)) {
        return NextResponse.json({ error: 'slug の形式が不正です' }, { status: 400 });
      }
      updates.slug = slug;
    }
    if (referrer_id !== undefined) updates.referrer_id = referrer_id || null;
    if (title !== undefined) updates.title = title?.trim() || null;
    if (blocks !== undefined) {
      if (!isPromoterBlockArray(blocks)) {
        return NextResponse.json({ error: 'blocks の形式が不正です' }, { status: 400 });
      }
      updates.blocks = blocks;
    }
    if (is_active !== undefined) updates.is_active = !!is_active;

    const client = getClient(createServerClient());
    const result = await client
      .from('promoter_pages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      return NextResponse.json({ error: 'Failed to update promoter page' }, { status: 500 });
    }
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = getClient(createServerClient());
    const result = await client.from('promoter_pages').delete().eq('id', id);

    if (result.error) {
      return NextResponse.json({ error: 'Failed to delete promoter page' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
