import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createServerClient } from '@/lib/supabase';
import { withAuth } from '@/lib/api-helpers';

// 許可するファイル種別
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];

// 許可するバケット名
const ALLOWED_BUCKETS = ['images', 'menu-images', 'news-images', 'ambassador-images', 'feedback-images', 'review-images', 'media-logos', 'banners'];

// F17: OG画像基準のリサイズ上限（長辺 1200px / 高さ 630px）
const MAX_DIMENSION = 1200;
const RESIZE_HEIGHT = 630;
// リサイズ対象から外す MIME（SVG はベクター、GIF はアニメ保持のため非対象）
const SKIP_RESIZE_MIMES = new Set(['image/svg+xml', 'image/gif']);

async function maybeResize(
  inputBuffer: Buffer,
  mime: string,
): Promise<{ buffer: Buffer; resized: boolean }> {
  if (SKIP_RESIZE_MIMES.has(mime)) {
    return { buffer: inputBuffer, resized: false };
  }
  try {
    const image = sharp(inputBuffer);
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    // 幅・高さ両方が閾値以内ならリサイズ不要（どちらか一方でも超えればリサイズする）
    if (width <= MAX_DIMENSION && height <= RESIZE_HEIGHT) {
      return { buffer: inputBuffer, resized: false };
    }
    // contain（fit: 'inside'）でアスペクト比保持しつつ MAX_DIMENSION x RESIZE_HEIGHT 内に縮小
    const resized = await image
      .resize({
        width: MAX_DIMENSION,
        height: RESIZE_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
    return { buffer: resized, resized: true };
  } catch (err) {
    console.warn('[admin/upload] sharp resize failed, falling back to original', err);
    return { buffer: inputBuffer, resized: false };
  }
}

export const POST = withAuth(async (request: NextRequest) => {
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
    const inputBuffer = Buffer.from(arrayBuffer);

    // F17: 1200px / 630px を超える場合のみ自動リサイズ（SVG/GIF はスキップ）
    const { buffer, resized } = await maybeResize(inputBuffer, file.type);
    if (resized) {
      console.log(
        `[admin/upload] resized to fit ${MAX_DIMENSION}x${RESIZE_HEIGHT}`,
        { fileName, originalSize: inputBuffer.length, newSize: buffer.length },
      );
    }

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
});
