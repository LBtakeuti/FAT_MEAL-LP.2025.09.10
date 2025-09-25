// データベースアダプター
// Supabaseが設定されていない場合はメモリ内DBを使用

import { db as memoryDb } from './db';

// 環境変数チェック
const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://example.supabase.co';

// Supabaseが設定されていればSupabaseを使用、そうでなければメモリDB
let dbAdapter: any;
let dbAdapterPromise: Promise<any> | null = null;

// 初期化関数
function initializeDatabase() {
  if (useSupabase && !dbAdapterPromise) {
    // Supabaseが設定されている場合
    dbAdapterPromise = import('./supabase').then(module => {
      dbAdapter = module.db;
      console.log('Using Supabase database');
      return dbAdapter;
    }).catch(error => {
      console.error('Failed to load Supabase, falling back to memory DB:', error);
      dbAdapter = convertMemoryDbToAdapter();
      return dbAdapter;
    });
  } else if (!dbAdapter) {
    // メモリDBを使用
    dbAdapter = convertMemoryDbToAdapter();
    console.log('Using in-memory database (Supabase not configured)');
  }
}

// 初期化を実行
initializeDatabase();

// メモリDBをSupabase互換のAPIに変換
function convertMemoryDbToAdapter() {
  return {
    menu: {
      async getAll() {
        const items = memoryDb.getAllMenuItems();
        return items.map(item => ({
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
      },
      
      async getById(id: string) {
        const item = memoryDb.getMenuItem(id);
        if (!item) return null;
        return {
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      },
      
      async create(item: any) {
        const id = crypto.randomUUID();
        const newItem = { ...item, id };
        memoryDb.updateMenuItem(id, newItem);
        return {
          ...newItem,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      },
      
      async update(id: string, updates: any) {
        const existingItem = memoryDb.getMenuItem(id);
        if (!existingItem) return false;
        memoryDb.updateMenuItem(id, { ...existingItem, ...updates });
        return true;
      },
      
      async delete(id: string) {
        memoryDb.deleteMenuItem(id);
        return true;
      }
    },
    
    news: {
      async getAll(publishedOnly = false) {
        const items = memoryDb.getAllNewsItems();
        const filtered = publishedOnly 
          ? items.filter((item: any) => item.isPublished)
          : items;
        return filtered.map(item => ({
          ...item,
          created_at: new Date().toISOString(),
          is_published: item.isPublished || false,
          published_at: item.publishedAt || new Date().toISOString()
        }));
      },
      
      async getById(id: string) {
        const item = memoryDb.getNewsItem(id);
        if (!item) return null;
        return {
          ...item,
          created_at: new Date().toISOString(),
          is_published: item.isPublished || false,
          published_at: item.publishedAt || new Date().toISOString()
        };
      },
      
      async create(item: any) {
        const id = crypto.randomUUID();
        const newItem = { 
          ...item, 
          id,
          isPublished: item.is_published || false,
          publishedAt: item.published_at || new Date().toISOString()
        };
        memoryDb.updateNewsItem(id, newItem);
        return {
          ...newItem,
          created_at: new Date().toISOString()
        };
      },
      
      async update(id: string, updates: any) {
        const existingItem = memoryDb.getNewsItem(id);
        if (!existingItem) return false;
        const updateData = {
          ...existingItem,
          ...updates,
          isPublished: updates.is_published !== undefined ? updates.is_published : existingItem.isPublished,
          publishedAt: updates.published_at || existingItem.publishedAt
        };
        memoryDb.updateNewsItem(id, updateData);
        return true;
      },
      
      async delete(id: string) {
        memoryDb.deleteNewsItem(id);
        return true;
      }
    },
    
    contact: {
      async create(contact: any) {
        // メモリDBにはcontact機能がないため、仮実装
        console.log('Contact form submission:', contact);
        return {
          id: crypto.randomUUID(),
          ...contact,
          status: 'pending',
          created_at: new Date().toISOString()
        };
      },
      
      async getAll() {
        // メモリDBにはcontact機能がないため、空配列を返す
        return [];
      },
      
      async updateStatus(id: string, status: string) {
        // メモリDBにはcontact機能がないため、仮実装
        console.log('Update contact status:', id, status);
        return true;
      }
    }
  };
}

// エクスポート
export const database = dbAdapter || convertMemoryDbToAdapter();

// 非同期でdbAdapterが設定されるのを待つ
export async function getDatabaseAdapter() {
  // 初期化を確認
  initializeDatabase();
  
  if (dbAdapterPromise) {
    // Supabaseの初期化が進行中の場合は完了を待つ
    return await dbAdapterPromise;
  }
  
  return dbAdapter || convertMemoryDbToAdapter();
}

// シンプルなgetter (メモリDBを直接返す)
export function getDbAdapter() {
  // Server Componentでは常にメモリDBを使用
  return memoryDb;
}