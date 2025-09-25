# Supabaseテーブル構造確認と修正

## 問題
`menu_items`テーブルに必要なカラムが存在していません。

## ステップ1: 現在のテーブル構造を確認

SQL Editorで以下を実行して、現在のテーブル構造を確認：

```sql
-- ここから下をすべてコピー --

-- menu_itemsテーブルの構造を確認
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'menu_items'
ORDER BY 
    ordinal_position;

-- ここまでコピー --
```

## ステップ2: 方法を選択

### 方法A: 既存テーブルを削除して作り直す（簡単だが、データが消える）

```sql
-- ここから下をすべてコピー --

-- 既存のテーブルと関連テーブルを削除
DROP TABLE IF EXISTS menu_items CASCADE;

-- 新しくテーブルを作成
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

-- 更新時刻を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ここまでコピー --
```

### 方法B: 既存テーブルにカラムを追加（データを保持）

```sql
-- ここから下をすべてコピー --

-- 不足しているカラムを追加（エラーが出ても続行）
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 300;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS protein DECIMAL(5,1);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS fat DECIMAL(5,1);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS carbs DECIMAL(5,1);
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS price INTEGER;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS description TEXT;

-- ここまでコピー --
```

## ステップ3: サンプルデータを追加

テーブル修正後、以下でサンプルデータを追加：

```sql
-- ここから下をすべてコピー --

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

## おすすめの手順

1. **ステップ1を実行**して現在のカラムを確認
2. データがない、または重要でない場合は**方法A**（削除して作り直す）
3. データを残したい場合は**方法B**（カラム追加）
4. **ステップ3**でサンプルデータ追加

## よくある原因

- Supabaseで自動生成されたテーブルを使っている
- 別の人が違う構造でテーブルを作成した
- 以前の設定が残っている

どちらの方法でも、最終的に正しい構造のテーブルになります。