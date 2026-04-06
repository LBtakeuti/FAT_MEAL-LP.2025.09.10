import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'ファイルが選択されていません' }, { status: 400 });
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: `ファイルサイズが上限を超えています（最大10MB、現在: ${(file.size / 1024 / 1024).toFixed(1)}MB）` },
        { status: 413 }
      );
    }

    // WebP変換
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const webpBuffer = await sharp(inputBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    const fileName = `media-logos/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

    const supabase = createServerClient();
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, webpBuffer, {
        cacheControl: '31536000',
        upsert: false,
        contentType: 'image/webp',
      });

    if (error) {
      return NextResponse.json({ message: `アップロードに失敗しました: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ message: 'アップロードに失敗しました' }, { status: 500 });
  }
}
