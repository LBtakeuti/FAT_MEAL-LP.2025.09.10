import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withAuth } from '@/lib/api-helpers';

// 顧客 email で purchase_surveys を取得（最新順）
export const GET = withAuth(async (request: NextRequest) => {
  const supabase = createServerClient() as any;
  const email = request.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json([], { status: 200 });

  const { data, error } = await supabase
    .from('purchase_surveys')
    .select('id, customer_email, q1_answers, q1_other_text, q2_answers, q2_other_text, q3_answers, q3_other_text, created_at')
    .eq('customer_email', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Survey fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
  return NextResponse.json(data || []);
});
