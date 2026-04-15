import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const supabase = createServerClient() as any;

  const { data, error } = await supabase
    .from('individual_messages')
    .select('id, slug, title, body_html, images, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ message: 'Failed to fetch message' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}
