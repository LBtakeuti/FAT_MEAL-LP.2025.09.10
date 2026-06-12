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

// SEO-S2: お知らせ一覧をサーバーサイドで取得（/news index・トップNewsSection のSSR用）。
// /api/news と同一（news を date DESC）。
export interface NewsServerItem {
  id: string;
  title: string;
  date: string;
  excerpt: string | null;
  content: string;
  image: string | null;
}

export async function getNewsServer(): Promise<NewsServerItem[]> {
  const { url, anonKey, serviceRoleKey } = validateEnv();
  const client = createClient<Database>(url, serviceRoleKey || anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await (client as any)
    .from('news')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('お知らせ取得エラー（サーバーサイド）:', error);
    return [];
  }

  return (data as NewsServerItem[]) || [];
}

// SEO-S3: お知らせ個別をサーバーサイドで取得（/news/[id] の generateMetadata・SSR用）。
// /api/news/[id] と同一（id 一致の単一レコード）。見つからなければ null。
export async function getNewsByIdServer(id: string): Promise<NewsServerItem | null> {
  const { url, anonKey, serviceRoleKey } = validateEnv();
  const client = createClient<Database>(url, serviceRoleKey || anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await (client as any)
    .from('news')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('お知らせ個別取得エラー（サーバーサイド）:', error);
    return null;
  }

  return (data as NewsServerItem | null) ?? null;
}

// SEO-S2: コラム一覧をサーバーサイドで取得（/blog index・トップBlogSection のSSR用）。
// /api/blog/list と同一条件（is_published・published_at<=now・published_at DESC）。
export interface ArticleListServerItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  tags: string[];
  author: string;
  published_at: string | null;
}

export async function getArticlesServer(
  limit = 12,
  offset = 0,
): Promise<{ items: ArticleListServerItem[]; total: number }> {
  const { url, anonKey, serviceRoleKey } = validateEnv();
  const client = createClient<Database>(url, serviceRoleKey || anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const nowIso = new Date().toISOString();
  const { data, count, error } = await (client as any)
    .from('articles')
    .select(
      'id, slug, title, excerpt, thumbnail_url, tags, author, published_at',
      { count: 'exact' },
    )
    .eq('is_published', true)
    .lte('published_at', nowIso)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('コラム一覧取得エラー（サーバーサイド）:', error);
    return { items: [], total: 0 };
  }

  return { items: (data as ArticleListServerItem[]) || [], total: count ?? 0 };
}

// SEO-S1: FAQ をサーバーサイドで取得（SSR/クローラーに本文を出すため）。
// /api/faqs と同一クエリ（is_active のみ・sort_order順）。
export interface FaqServerItem {
  id: string;
  question: string;
  answer_title: string;
  answer_detail: string;
  sort_order: number;
}

export async function getFaqsServer(): Promise<FaqServerItem[]> {
  const { url, anonKey, serviceRoleKey } = validateEnv();

  const client = createClient<Database>(url, serviceRoleKey || anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await (client as any)
    .from('faqs')
    .select('id, question, answer_title, answer_detail, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('FAQ取得エラー（サーバーサイド）:', error);
    return [];
  }

  return (data as FaqServerItem[]) || [];
}

