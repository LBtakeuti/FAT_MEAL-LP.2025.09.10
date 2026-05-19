import type { SupabaseClient } from '@supabase/supabase-js';

export const SHARE_PHOTO_BUCKET = 'share-photos';

/** 写真の公開URLを返す（取得失敗時は空文字） */
export function getSharePhotoUrl(supabase: SupabaseClient, filePath: string): string {
  const { data } = supabase.storage.from(SHARE_PHOTO_BUCKET).getPublicUrl(filePath);
  return data?.publicUrl || '';
}
