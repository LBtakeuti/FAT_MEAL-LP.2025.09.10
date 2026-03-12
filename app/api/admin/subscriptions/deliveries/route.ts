import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function PATCH(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'delivery id is required' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await (supabase.from('subscription_deliveries') as any)
      .update({ carrier_notified_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Failed to update delivery:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update delivery:', error);
    return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 });
  }
}
