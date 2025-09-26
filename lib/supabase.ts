import { createClient } from '@supabase/supabase-js';

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

// クライアント側用のSupabaseクライアント
export function createBrowserClient() {
  const { url, anonKey } = validateEnv();
  
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

// サーバー側用のSupabaseクライアント（管理者権限）
export function createServerClient() {
  const { url, serviceRoleKey } = validateEnv();
  
  if (!serviceRoleKey) {
    throw new Error(
      'サーバー側のSupabaseクライアントにはSUPABASE_SERVICE_ROLE_KEYが必要です。'
    );
  }
  
  return createClient(url, serviceRoleKey, {
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

// データベーステーブルの型定義
export interface MenuItemDB {
  id: string;
  name: string;
  description: string;
  price: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  images: string[];
  features: string[];
  ingredients: string[];
  allergens: string[];
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface NewsItemDB {
  id: string;
  title: string;
  date: string;
  content: string;
  category?: string | null;
  excerpt?: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ContactDB {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
  status: 'pending' | 'responded' | 'closed';
}

// ストレージバケット名
export const STORAGE_BUCKETS = {
  MENU_IMAGES: 'menu-images',
  NEWS_IMAGES: 'news-images',
  OTHER_IMAGES: 'other-images'
} as const;

// ストレージヘルパー関数
export async function uploadImage(
  file: File, 
  bucket: keyof typeof STORAGE_BUCKETS,
  folder?: string
): Promise<string | null> {
  if (!supabase) {
    console.error('Supabaseクライアントが初期化されていません');
    return null;
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = folder ? `${folder}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('画像アップロードエラー:', error);
    return null;
  }

  // 公開URLを取得
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteImage(
  url: string,
  bucket: keyof typeof STORAGE_BUCKETS
): Promise<boolean> {
  if (!supabase) {
    console.error('Supabaseクライアントが初期化されていません');
    return false;
  }

  // URLからファイルパスを抽出
  const urlParts = url.split('/');
  const bucketIndex = urlParts.findIndex(part => part === STORAGE_BUCKETS[bucket]);
  if (bucketIndex === -1) return false;
  
  const filePath = urlParts.slice(bucketIndex + 1).join('/');

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .remove([filePath]);

  if (error) {
    console.error('画像削除エラー:', error);
    return false;
  }

  return true;
}

// データベースヘルパー関数
export const db = {
  // メニューアイテム
  menu: {
    async getAll(): Promise<MenuItemDB[]> {
      const client = createBrowserClient();
      if (!client) return [];
      
      const { data, error } = await client
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('メニュー取得エラー:', error);
        return [];
      }
      
      return data || [];
    },
    
    async getById(id: string): Promise<MenuItemDB | null> {
      const client = createBrowserClient();
      if (!client) return null;
      
      const { data, error } = await client
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('メニュー取得エラー:', error);
        return null;
      }
      
      return data;
    },
    
    async create(item: Omit<MenuItemDB, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItemDB | null> {
      const client = createServerClient();
      
      const { data, error } = await client
        .from('menu_items')
        .insert(item)
        .select()
        .single();
      
      if (error) {
        console.error('メニュー作成エラー:', error);
        return null;
      }
      
      return data;
    },
    
    async update(id: string, updates: Partial<MenuItemDB>): Promise<boolean> {
      const client = createServerClient();
      
      const { error } = await client
        .from('menu_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) {
        console.error('メニュー更新エラー:', error);
        return false;
      }
      
      return true;
    },
    
    async delete(id: string): Promise<boolean> {
      const client = createServerClient();
      
      const { error } = await client
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('メニュー削除エラー:', error);
        return false;
      }
      
      return true;
    }
  },
  
  // ニュース
  news: {
    async getAll(publishedOnly = false): Promise<NewsItemDB[]> {
      const client = createBrowserClient();
      if (!client) return [];
      
      let query = client.from('news_items').select('*');
      
      if (publishedOnly) {
        query = query.eq('is_published', true);
      }
      
      const { data, error } = await query.order('published_at', { ascending: false });
      
      if (error) {
        console.error('ニュース取得エラー:', error);
        return [];
      }
      
      return data || [];
    },
    
    async getById(id: string): Promise<NewsItemDB | null> {
      const client = createBrowserClient();
      if (!client) return null;
      
      const { data, error } = await client
        .from('news_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('ニュース取得エラー:', error);
        return null;
      }
      
      return data;
    },
    
    async create(item: Omit<NewsItemDB, 'id' | 'created_at'>): Promise<NewsItemDB | null> {
      const client = createServerClient();
      
      const { data, error } = await client
        .from('news_items')
        .insert(item)
        .select()
        .single();
      
      if (error) {
        console.error('ニュース作成エラー:', error);
        console.error('エラー詳細:', error.message, error.details, error.hint);
        return null;
      }
      
      return data;
    },
    
    async update(id: string, updates: Partial<NewsItemDB>): Promise<boolean> {
      const client = createServerClient();
      
      const { error } = await client
        .from('news_items')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('ニュース更新エラー:', error);
        return false;
      }
      
      return true;
    },
    
    async delete(id: string): Promise<boolean> {
      const client = createServerClient();
      
      const { error } = await client
        .from('news_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('ニュース削除エラー:', error);
        return false;
      }
      
      return true;
    }
  },
  
  // お問い合わせ
  contact: {
    async create(contact: Omit<ContactDB, 'id' | 'created_at' | 'status'>): Promise<ContactDB | null> {
      const client = createBrowserClient();
      if (!client) return null;
      
      const { data, error } = await client
        .from('contacts')
        .insert({ ...contact, status: 'pending' })
        .select()
        .single();
      
      if (error) {
        console.error('お問い合わせ送信エラー:', error);
        return null;
      }
      
      return data;
    },
    
    async getAll(): Promise<ContactDB[]> {
      const client = createServerClient();
      
      const { data, error } = await client
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('お問い合わせ取得エラー:', error);
        return [];
      }
      
      return data || [];
    },
    
    async updateStatus(id: string, status: ContactDB['status']): Promise<boolean> {
      const client = createServerClient();
      
      const { error } = await client
        .from('contacts')
        .update({ status })
        .eq('id', id);
      
      if (error) {
        console.error('ステータス更新エラー:', error);
        return false;
      }
      
      return true;
    }
  }
};