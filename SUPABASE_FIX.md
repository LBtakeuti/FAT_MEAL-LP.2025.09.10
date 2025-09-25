# Supabaseテーブル修正ガイド

## 状況
`news_items`テーブルは既に作成されているようです。そのため、ステップ2-3をスキップして、ステップ5のセキュリティ設定に進んでください。

## 現在のテーブルを確認

### 1. Table Editorで確認
1. 左側のメニューから「Table Editor」をクリック
2. 存在するテーブルを確認：
   - ✅ `menu_items` - あれば OK
   - ✅ `news_items` - あれば OK（既にあるようです）
   - ❓ `contacts` - あるか確認

### 2. contactsテーブルがない場合のみ作成

SQL Editorで新しいタブを開いて、以下をコピー&ペースト：

```sql
-- ここから下をすべてコピー --

-- お問い合わせテーブル（まだ作成していない場合のみ）
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（エラーが出ても問題ありません）
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status, created_at DESC);

-- ここまでコピー --
```

「Run」ボタンをクリック

## 次に、ストレージとセキュリティ設定

### ステップ3: ストレージ作成
SUPABASE_SIMPLE_SETUP.mdのステップ3を実行

### ステップ5: セキュリティ設定
SUPABASE_SIMPLE_SETUP.mdのステップ5を実行（以下のSQLを実行）：

```sql
-- ここから下をすべてコピー --

-- まず既存のポリシーを削除（エラーが出ても気にしない）
DROP POLICY IF EXISTS "Public read access" ON menu_items;
DROP POLICY IF EXISTS "Service role full access" ON menu_items;
DROP POLICY IF EXISTS "Public read published news" ON news_items;
DROP POLICY IF EXISTS "Service role full access news" ON news_items;
DROP POLICY IF EXISTS "Public can create contacts" ON contacts;
DROP POLICY IF EXISTS "Service role full access contacts" ON contacts;
DROP POLICY IF EXISTS "Allow all access" ON menu_items;
DROP POLICY IF EXISTS "Allow all access" ON news_items;
DROP POLICY IF EXISTS "Allow all access" ON contacts;

-- RLS（Row Level Security）を有効化
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- menu_items テーブル：誰でも読み書き可能（開発用）
CREATE POLICY "Allow all access menu" ON menu_items
  FOR ALL USING (true) WITH CHECK (true);

-- news_items テーブル：誰でも読み書き可能（開発用）
CREATE POLICY "Allow all access news" ON news_items
  FOR ALL USING (true) WITH CHECK (true);

-- contacts テーブル：誰でも読み書き可能（開発用）
CREATE POLICY "Allow all access contacts" ON contacts
  FOR ALL USING (true) WITH CHECK (true);

-- ここまでコピー --
```

## 動作確認

1. http://localhost:3007 を開いて確認
2. もしメニューが表示されない場合は、サンプルデータを追加：

### 方法1: 既存データを残してサンプルデータを追加（推奨）

```sql
-- ここから下をすべてコピー --

-- サンプルデータを追加（既存データはそのまま）
INSERT INTO menu_items (name, description, price, calories, protein, fat, carbs, images, features, ingredients, allergens, stock)
VALUES 
  ('チキン南蛮弁当', 'ジューシーなチキン南蛮に特製タルタルソースをたっぷりかけました', 850, 750, 32, 25, 85, 
   ARRAY['/bento_1.jpeg'], 
   ARRAY['高タンパク', '人気No.1', '甘酢ダレ'], 
   ARRAY['鶏肉', '小麦粉', '卵', 'タルタルソース', 'キャベツ', '白米'],
   ARRAY['小麦', '卵', '乳'],
   300),
   
  ('鮭の塩焼き弁当', '脂ののった鮭を丁寧に焼き上げ、副菜と共にバランスよく詰めました', 780, 620, 28, 18, 72,
   ARRAY['/bento_1.jpeg'],
   ARRAY['低脂質', 'ヘルシー', 'DHA豊富'],
   ARRAY['鮭', 'ほうれん草', 'ひじき', '白米', '大根'],
   ARRAY['さけ', '大豆'],
   300),
   
  ('豚の生姜焼き弁当', '特製の生姜ダレで味付けした豚肉と、彩り豊かな野菜を組み合わせました', 820, 680, 26, 22, 78,
   ARRAY['/bento_1.jpeg'],
   ARRAY['スタミナ満点', 'ビタミンB豊富', '定番人気'],
   ARRAY['豚肉', '生姜', 'キャベツ', '人参', '白米'],
   ARRAY['豚肉', '小麦', '大豆'],
   300);

-- ここまでコピー --
```

「Run」ボタンをクリック