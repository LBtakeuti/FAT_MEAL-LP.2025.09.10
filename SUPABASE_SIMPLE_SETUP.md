# Supabase簡単セットアップガイド

## ステップ1: Supabaseダッシュボードにログイン

1. ブラウザで https://supabase.com/dashboard を開く
2. 作成したプロジェクトをクリック

## ステップ2: データベーステーブルを作成

### 2-1. SQL Editorを開く

1. 左側のメニューから「SQL Editor」をクリック
2. 「+ New query」ボタンをクリック

### 2-2. メニューアイテムテーブルを作成

以下のコードを**すべてコピー**して、SQL Editorに**貼り付け**てください：

```sql
-- ここから下をすべてコピー --

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

**貼り付けたら、右下の「Run」ボタンをクリック**

成功すると「Success. No rows returned」と表示されます。

### 2-3. ニューステーブルを作成

「+ New query」ボタンをもう一度クリックして、新しいタブを開きます。

以下のコードを**すべてコピー**して貼り付けてください：

```sql
-- ここから下をすべてコピー --

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

-- インデックス作成（検索高速化）
CREATE INDEX idx_news_published ON news_items(is_published, published_at DESC);

-- ここまでコピー --
```

**貼り付けたら、右下の「Run」ボタンをクリック**

### 2-4. お問い合わせテーブルを作成

「+ New query」ボタンをもう一度クリックして、新しいタブを開きます。

以下のコードを**すべてコピー**して貼り付けてください：

```sql
-- ここから下をすべてコピー --

-- お問い合わせテーブル
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_contacts_status ON contacts(status, created_at DESC);

-- ここまでコピー --
```

**貼り付けたら、右下の「Run」ボタンをクリック**

## ステップ3: 画像保存用のストレージを作成

### 3-1. Storageメニューを開く

1. 左側のメニューから「Storage」をクリック
2. 「New bucket」ボタンをクリック

### 3-2. メニュー画像用バケットを作成

1. **Bucket name**: `menu-images` と入力
2. **Public bucket**: チェックを**入れる**（オン）
3. 「Create bucket」ボタンをクリック

### 3-3. ニュース画像用バケットを作成

1. もう一度「New bucket」ボタンをクリック
2. **Bucket name**: `news-images` と入力
3. **Public bucket**: チェックを**入れる**（オン）
4. 「Create bucket」ボタンをクリック

### 3-4. その他画像用バケットを作成

1. もう一度「New bucket」ボタンをクリック
2. **Bucket name**: `other-images` と入力
3. **Public bucket**: チェックを**入れる**（オン）
4. 「Create bucket」ボタンをクリック

## ステップ4: テーブルが作成されているか確認

### 4-1. Table Editorで確認

1. 左側のメニューから「Table Editor」をクリック
2. 以下の3つのテーブルが表示されているか確認：
   - `menu_items`
   - `news_items`
   - `contacts`

**もしテーブルがない場合は、ステップ2に戻ってテーブル作成をやり直してください。**

## ステップ5: セキュリティ設定を行う（基本設定のみ）

### 5-1. SQL Editorで簡単設定

1. 左側のメニューから「SQL Editor」をクリック
2. 「+ New query」ボタンをクリック
3. 以下のコードを**すべてコピー**して貼り付け：

```sql
-- ここから下をすべてコピー --

-- まず既存のポリシーを削除（エラーが出ても気にしない）
DROP POLICY IF EXISTS "Public read access" ON menu_items;
DROP POLICY IF EXISTS "Service role full access" ON menu_items;
DROP POLICY IF EXISTS "Public read published news" ON news_items;
DROP POLICY IF EXISTS "Service role full access news" ON news_items;
DROP POLICY IF EXISTS "Public can create contacts" ON contacts;
DROP POLICY IF EXISTS "Service role full access contacts" ON contacts;

-- RLS（Row Level Security）を有効化
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- menu_items テーブル：誰でも読み書き可能（開発用）
CREATE POLICY "Allow all access" ON menu_items
  FOR ALL USING (true) WITH CHECK (true);

-- news_items テーブル：誰でも読み書き可能（開発用）
CREATE POLICY "Allow all access" ON news_items
  FOR ALL USING (true) WITH CHECK (true);

-- contacts テーブル：誰でも読み書き可能（開発用）
CREATE POLICY "Allow all access" ON contacts
  FOR ALL USING (true) WITH CHECK (true);

-- ここまでコピー --
```

4. **「Run」ボタンをクリック**

**注意**: これは開発用の設定です。本番環境では適切なセキュリティ設定が必要です。

### 4-2. 設定が成功したか確認

1. 左側のメニューから「Table Editor」をクリック
2. 各テーブル（menu_items、news_items、contacts）の横に鍵のアイコンが表示されていればOK

### ※ もし「New Policy」ボタンが見つからない場合

上記のSQL Editorでの設定で十分です。「New Policy」ボタンは以下の場所にありますが、使わなくても大丈夫です：

1. 左メニューの「Authentication」をクリック
2. 上部のタブで「Policies」を選択（もしタブが見えない場合は、「Database」→「Policies」を試してください）
3. テーブルを選択してから「New Policy」ボタンが表示されます

**ただし、SQL Editorで設定する方が簡単なので、上記の方法をお勧めします。**

## ステップ5: サンプルデータを追加（任意）

### 5-1. サンプルメニューデータ

SQL Editorで新しいタブを開いて、以下を**すべてコピー**して貼り付け：

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

**「Run」ボタンをクリック**

## ステップ6: 動作確認

1. ブラウザで http://localhost:3007 を開く
2. メニューが表示されることを確認
3. 管理画面 http://localhost:3007/admin でメニューを追加
4. 追加したメニューがサイトに表示されることを確認

## よくある質問

### Q: 「Success. No rows returned」と表示されたけど大丈夫？
A: はい、テーブル作成は成功しています。データを返さないコマンドなので正常です。

### Q: エラーが出た場合は？
A: エラーメッセージをコピーして、以下を確認：
- コピー範囲が正しいか（「ここから」～「ここまで」）
- 同じテーブルを2回作成していないか

### Q: テーブルが作成されたか確認したい
A: 左メニューの「Table Editor」をクリックすると、作成したテーブルが表示されます。

## 完了！

これでSupabaseの設定は完了です。
サイトが自動的にSupabaseのデータベースを使用するようになります。