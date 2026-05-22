import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { MenuItemDB } from '@/types';

// 環境変数の型定義
type SupabaseEnv = {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
};

// 環境変数の検証
function validateEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabaseの環境変数が設定されていません。' +
      '.env.localファイルにNEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを設定してください。'
    );
  }

  return { url, anonKey, serviceRoleKey };
}

// シングルトンインスタンス（ブラウザ側のみ）
let browserClientInstance: ReturnType<typeof createClient<Database>> | null = null;

// クライアント側用のSupabaseクライアント（シングルトン）
export function createBrowserClient() {
  if (browserClientInstance) {
    return browserClientInstance;
  }

  const { url, anonKey } = validateEnv();
  
  browserClientInstance = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  
  return browserClientInstance;
}

// サーバー側用のSupabaseクライアント（管理者権限）
// シングルトンを廃止 — サーバーレス環境でenv varsを毎回フレッシュに読む
export function createServerClient() {
  const { url, serviceRoleKey } = validateEnv();

  if (!serviceRoleKey) {
    throw new Error(
      'サーバー側のSupabaseクライアントにはSUPABASE_SERVICE_ROLE_KEYが必要です。'
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// デフォルトのクライアント（クライアント側用）
const supabase = typeof window !== 'undefined' 
  ? createBrowserClient() 
  : null;

export default supabase;

// 型定義は @/types から再エクスポート
export type { MenuItemDB, NewsItemDB, ContactDB } from '@/types';

// ストレージバケット名
export const STORAGE_BUCKETS = {
  MENU_IMAGES: 'images',
  NEWS_IMAGES: 'images',
  OTHER_IMAGES: 'images'
} as const;

// サーバーサイド用メニュー取得関数（SSR対応）
export async function getMenuItemsServer(limit?: number): Promise<MenuItemDB[]> {
  const { url, anonKey, serviceRoleKey } = validateEnv();

  // サーバーサイドではシングルトンを使わず新しいクライアントを作成
  const client = createClient<Database>(url, serviceRoleKey || anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  let query = client
    .from('menu_items')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('メニュー取得エラー（サーバーサイド）:', error);
    return [];
  }

  return data || [];
}

