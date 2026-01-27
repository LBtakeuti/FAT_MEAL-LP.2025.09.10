import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// 個別取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const client = supabase as unknown as { from: (table: string) => any };

    const result = await client.from('referrers')
      .select('*')
      .eq('id', id)
      .single();

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: '紹介者が見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const client = supabase as unknown as { from: (table: string) => any };
    const body = await request.json();

    const { name, email, phone, notes, is_active } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: '紹介者名は必須です' },
        { status: 400 }
      );
    }

    const result = await client.from('referrers')
      .update({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        notes: notes?.trim() || null,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (result.error) {
      console.error('Failed to update referrer:', result.error);
      return NextResponse.json(
        { error: 'Failed to update referrer' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const client = supabase as unknown as { from: (table: string) => any };

    const result = await client.from('referrers')
      .delete()
      .eq('id', id);

    if (result.error) {
      console.error('Failed to delete referrer:', result.error);
      return NextResponse.json(
        { error: 'Failed to delete referrer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
