import { NextResponse } from 'next/server';

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
    },
    connection: {
      status: 'unknown',
      error: null,
      tables: {}
    }
  };

  try {
    // Supabaseのインポートを試みる
    const { createServerClient } = await import('@/lib/supabase');
    const supabase = createServerClient();
    
    // テーブルの存在確認（正しいテーブル名を使用）
    const { data: menuData, error: menuError } = await supabase
      .from('menu_items')
      .select('count')
      .single();
    
    results.connection.tables.menu_items = menuError ? `Error: ${menuError.message}` : 'OK';
    
    const { data: newsData, error: newsError } = await supabase
      .from('news_items')
      .select('count')
      .single();
    
    results.connection.tables.news_items = newsError ? `Error: ${newsError.message}` : 'OK';
    
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('count')
      .single();
    
    results.connection.tables.contacts = contactError ? `Error: ${contactError.message}` : 'OK';
    
    results.connection.status = 'connected';
    
  } catch (error: any) {
    results.connection.status = 'failed';
    results.connection.error = error.message || 'Unknown error';
  }

  // 実際に使用されているDBアダプタを確認
  try {
    const { getDatabaseAdapter } = await import('@/lib/db-adapter');
    const db = await getDatabaseAdapter();
    
    // メモリDBかSupabaseか判定
    if (db && db.menu) {
      const menuItems = await db.menu.getAll();
      results.activeDatabase = menuItems.length > 0 ? 'Active (Items found)' : 'Active (Empty)';
      results.itemCount = menuItems.length;
    }
  } catch (error: any) {
    results.activeDatabase = 'Error checking active DB';
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}