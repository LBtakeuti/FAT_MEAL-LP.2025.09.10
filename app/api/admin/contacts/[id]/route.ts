import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();
    
    // ステータスのバリデーション
    if (body.status && !['pending', 'responded', 'closed'].includes(body.status)) {
      return NextResponse.json(
        { message: 'ステータスが無効です' },
        { status: 400 }
      );
    }
    
    const { data, error } = await (supabase
      .from('contacts') as any)
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      return NextResponse.json(
        { message: 'ステータスの更新に失敗しました', error: error?.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Failed to update contact status:', error);
    return NextResponse.json(
      { message: 'ステータスの更新に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json(
        { message: 'お問い合わせの削除に失敗しました', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: '削除しました' });
  } catch (error: any) {
    console.error('Failed to delete contact:', error);
    return NextResponse.json(
      { message: 'お問い合わせの削除に失敗しました', error: error.message },
      { status: 500 }
    );
  }
}







