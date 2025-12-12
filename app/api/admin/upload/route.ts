import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'images';

    if (!file) {
      return NextResponse.json(
        { message: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // ファイル名を生成（タイムスタンプ + ランダム文字列）
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // FileをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Supabase Storageにアップロード
    const supabase = createServerClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return NextResponse.json(
        { message: `アップロードに失敗しました: ${error.message}` },
        { status: 500 }
      );
    }

    // 公開URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { message: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
}
