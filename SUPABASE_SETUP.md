# Supabase連携ガイド

## 概要
このドキュメントは、futorumeshi-lpプロジェクトをSupabaseと連携するための設定手順を説明します。

## 必要なテーブル構造

### 1. menu_itemsテーブル
```sql
CREATE TABLE menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price VARCHAR(50) NOT NULL,
  calories VARCHAR(50),
  protein VARCHAR(50),
  fat VARCHAR(50),
  carbs VARCHAR(50),
  stock INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. menu_item_imagesテーブル
```sql
CREATE TABLE menu_item_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. menu_item_featuresテーブル
```sql
CREATE TABLE menu_item_features (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);
```

### 4. menu_item_ingredientsテーブル
```sql
CREATE TABLE menu_item_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);
```

### 5. menu_item_allergensテーブル
```sql
CREATE TABLE menu_item_allergens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL
);
```

### 6. news_itemsテーブル
```sql
CREATE TABLE news_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(100),
  content TEXT,
  excerpt TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. admin_usersテーブル
```sql
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);
```

### 8. ordersテーブル（購入管理）
```sql
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  total_amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. order_itemsテーブル
```sql
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  subtotal DECIMAL(10,2)
);
```

## 環境変数設定

`.env.local`ファイルに以下を追加：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Storage Bucket名
SUPABASE_STORAGE_BUCKET=menu-images
```

## インストール

```bash
npm install @supabase/supabase-js
```

## クライアント設定

`lib/supabase.ts`を作成：

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Storage設定

1. Supabaseダッシュボードで`menu-images`バケットを作成
2. バケットをpublicに設定
3. CORSポリシーを設定

## リアルタイム機能

在庫のリアルタイム更新：

```typescript
// 在庫変更をリアルタイムで監視
const subscription = supabase
  .channel('menu_items')
  .on('postgres_changes', 
    { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'menu_items' 
    }, 
    (payload) => {
      console.log('Stock updated:', payload)
    }
  )
  .subscribe()
```

## 画像アップロード

```typescript
// Supabase Storageへの画像アップロード
const uploadImage = async (file: File) => {
  const fileName = `${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('menu-images')
    .upload(fileName, file)
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('menu-images')
    .getPublicUrl(fileName)
  
  return publicUrl
}
```

## 移行手順

1. Supabaseプロジェクトを作成
2. 上記のテーブルを作成
3. Storageバケットを設定
4. 環境変数を設定
5. 既存のコードをSupabase APIに置き換え

## セキュリティ

### Row Level Security (RLS)設定例

```sql
-- menu_itemsテーブルのRLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員可能
CREATE POLICY "Allow public read" ON menu_items
  FOR SELECT USING (true);

-- 書き込みは認証済みユーザーのみ
CREATE POLICY "Allow authenticated write" ON menu_items
  FOR ALL USING (auth.role() = 'authenticated');
```

## バックアップ

定期的なバックアップ設定：
- Supabaseダッシュボードからバックアップを有効化
- 毎日自動バックアップを設定

## 注意事項

1. **本番環境移行前**
   - すべての環境変数を本番用に更新
   - RLSポリシーを適切に設定
   - バックアップ戦略を確立

2. **パフォーマンス**
   - インデックスを適切に設定
   - 画像の最適化を実施
   - キャッシュ戦略を検討

3. **コスト管理**
   - 使用量のモニタリング
   - 適切なプランの選択