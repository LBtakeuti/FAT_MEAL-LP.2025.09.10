# 現在の状況と次のステップ

## ✅ 完了済み

1. **環境変数テンプレート作成済み**
   - `.env.local.example` - 環境変数のテンプレート
   - `ENVIRONMENT_SETUP.md` - 詳細な設定ガイド

2. **Supabaseクライアント実装済み**
   - `lib/supabase.ts` - クライアントとヘルパー関数
   - `@supabase/supabase-js` パッケージインストール済み

3. **管理画面実装済み**
   - メニュー管理（複数画像対応）
   - ニュース管理
   - 在庫管理
   - 画像アップロード機能

## ❌ 未完了 - 必要な作業

### 1. `.env.local`ファイルの作成
```bash
# テンプレートをコピー
cp .env.local.example .env.local
```

その後、以下の値を設定:
- `NEXT_PUBLIC_SUPABASE_URL` - SupabaseダッシュボードのProject Settings > APIから取得
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 同じくAPIセクションから取得  
- `SUPABASE_SERVICE_ROLE_KEY` - APIセクションのservice_roleキー

### 2. Supabaseプロジェクトの設定

#### a. Supabaseアカウント作成
1. https://supabase.com にアクセス
2. GitHubまたはメールでサインアップ
3. 新しいプロジェクトを作成

#### b. データベーステーブル作成
Supabase SQL Editorで以下を実行:

```sql
-- メニューアイテムテーブル
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1) NOT NULL,
  fat DECIMAL(5,1) NOT NULL,
  carbs DECIMAL(5,1) NOT NULL,
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  ingredients TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ニューステーブル
CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  image TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- お問い合わせテーブル
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### c. ストレージバケット作成
Supabase Storage > New bucketで以下を作成:
- `menu-images` (公開バケット)
- `news-images` (公開バケット)
- `other-images` (公開バケット)

### 3. APIエンドポイントの更新

現在のAPIエンドポイント（`/app/api/`以下）をSupabaseを使うように更新:

#### 例: `/app/api/menu/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const menuItems = await db.menu.getAll();
    return NextResponse.json(menuItems);
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json(
      { message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
```

### 4. 画像アップロードの更新

`/app/api/admin/upload/route.ts`をSupabase Storageを使うように更新:

```typescript
import { uploadImage, STORAGE_BUCKETS } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  const url = await uploadImage(file, 'MENU_IMAGES');
  
  if (!url) {
    return NextResponse.json(
      { message: 'アップロードに失敗しました' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ url });
}
```

### 5. 既存データの移行

現在のメモリ内データ（`/lib/db.ts`）をSupabaseに移行:

```typescript
// migration.ts
import { db as memoryDb } from '@/lib/db';
import { db as supabaseDb } from '@/lib/supabase';

async function migrate() {
  // メニューアイテムの移行
  const menuItems = memoryDb.getAllMenuItems();
  for (const item of menuItems) {
    await supabaseDb.menu.create(item);
  }
  
  // ニュースの移行
  const newsItems = memoryDb.getAllNewsItems();
  for (const item of newsItems) {
    await supabaseDb.news.create(item);
  }
  
  console.log('移行完了');
}
```

### 6. 認証システムの更新（オプション）

Supabase Authを使用する場合:

```typescript
// lib/supabase-auth.ts
import { createBrowserClient } from '@/lib/supabase';

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function signOut() {
  const supabase = createBrowserClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}
```

## 📋 チェックリスト

- [ ] `.env.local`ファイル作成
- [ ] Supabaseプロジェクト作成
- [ ] Supabase環境変数設定
- [ ] データベーステーブル作成
- [ ] ストレージバケット作成
- [ ] APIエンドポイント更新
- [ ] 画像アップロード機能更新
- [ ] 既存データの移行
- [ ] 動作テスト

## 🚀 動作確認

1. 開発サーバー再起動:
```bash
npm run dev
```

2. 管理画面でメニュー作成テスト:
- http://localhost:3007/admin
- 新しいメニューアイテムを作成
- 画像アップロードが動作することを確認

3. フロントエンド確認:
- http://localhost:3007
- 作成したメニューが表示されることを確認

## ⚠️ 注意事項

1. **環境変数のセキュリティ**
   - `SUPABASE_SERVICE_ROLE_KEY`は絶対に公開しない
   - `.env.local`はGitにコミットしない

2. **本番環境への移行**
   - Vercel等にデプロイする際は、環境変数を設定パネルで設定
   - RLS（Row Level Security）を有効化してセキュリティを強化

3. **バックアップ**
   - 現在のデータをバックアップしてから移行作業を開始