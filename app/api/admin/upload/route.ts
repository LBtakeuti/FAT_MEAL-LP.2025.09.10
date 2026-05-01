import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// 許可するファイル種別
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

// 許可するバケット名
const ALLOWED_BUCKETS = ['images', 'menu-images', 'news-images', 'ambassador-images', 'feedback-images', 'media-logos', 'banners'];

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

    // バケット名の検証
    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return NextResponse.json(
        { message: '不正なアップロード先です' },
        { status: 400 }
      );
    }

    // ファイルサイズの検証
    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: `ファイルサイズが上限を超えています（最大4MB、現在: ${(file.size / 1024 / 1024).toFixed(1)}MB）` },
        { status: 413 }
      );
    }

    // MIME種別の検証
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: '許可されていないファイル形式です。JPEG、PNG、WebP、GIF、SVGのみアップロードできます。' },
        { status: 400 }
      );
    }

    // 拡張子の検証
    const fileExt = (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { message: '許可されていないファイル拡張子です' },
        { status: 400 }
      );
    }

    // ファイル名を生成（タイムスタンプ + ランダム文字列）
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // FileをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Supabase Storageにアップロード
    const supabase = createServerClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) {
      console.error('Supabase Storage upload error:', error);
      return NextResponse.json(
        { message: 'アップロードに失敗しました' },
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
