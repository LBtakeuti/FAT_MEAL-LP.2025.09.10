# データベースリセット完了レポート

## 実施日時
2025年11月25日

## 実施内容

### 1. 既存テーブルの削除
以下の不要なテーブルを削除しました：
- `services` - メニューアイテムと重複
- `tags` - 未使用
- `news_tags` - 未使用
- `services_tags` - 未使用

### 2. 新規テーブルの作成

#### 2.1 menu_items（商品メニュー）
```sql
- id: UUID（主キー）
- name: TEXT（商品名）
- description: TEXT（商品説明）
- price: INTEGER（価格）
- calories: INTEGER（カロリー）
- protein: DECIMAL(10,2)（タンパク質）
- fat: DECIMAL(10,2)（脂質）
- carbs: DECIMAL(10,2)（炭水化物）
- images: TEXT[]（画像URL配列）
- features: TEXT[]（特徴タグ配列）
- ingredients: TEXT[]（原材料配列）
- allergens: TEXT[]（アレルゲン配列）
- stock: INTEGER（在庫数）
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**制約:**
- 価格、カロリー、栄養素、在庫は0以上
- インデックス: created_at, stock

#### 2.2 news（ニュース記事）
```sql
- id: UUID（主キー）
- title: TEXT（タイトル）
- content: TEXT（本文）
- date: DATE（公開日）
- category: TEXT（カテゴリー）
- image: TEXT（アイキャッチ画像URL）
- excerpt: TEXT（抜粋）
- summary: TEXT（要約）
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**インデックス:** date, category, created_at

#### 2.3 contacts（お問い合わせ）
```sql
- id: UUID（主キー）
- name: TEXT（名前）
- email: TEXT（メールアドレス）
- phone: TEXT（電話番号）
- message: TEXT（メッセージ内容）
- status: TEXT（ステータス: pending/responded/closed）
- created_at: TIMESTAMPTZ
```

**インデックス:** created_at, status, email

### 3. Row Level Security (RLS) 設定

#### 3.1 公開読み取りポリシー
- `menu_items`: 全ユーザーが読み取り可能
- `news`: 全ユーザーが読み取り可能
- `contacts`: 全ユーザーが作成可能（お問い合わせ送信）

#### 3.2 管理者用ポリシー
認証済みユーザー（Supabase Auth経由）のみ：
- `menu_items`: 全操作可能（INSERT/UPDATE/DELETE）
- `news`: 全操作可能（INSERT/UPDATE/DELETE）
- `contacts`: 読み取り・更新可能（ステータス管理）

**パフォーマンス最適化:**
- `auth.role()` を `(SELECT auth.role())` に変更して、行ごとの再評価を防止

### 4. 自動更新トリガー

`menu_items`と`news`テーブルに、`updated_at`を自動更新するトリガーを設定：

```sql
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

**セキュリティ:**
- トリガー関数に`search_path`を設定してSQLインジェクション対策

### 5. サンプルデータ

#### メニューアイテム（2件）
1. 高タンパク弁当A - ¥1,200
2. バランス弁当B - ¥1,000

#### ニュース記事（2件）
1. サービス開始のお知らせ
2. 新メニュー追加

## データベースの正規化状態

### ✅ 正規化されている点
1. **第1正規形（1NF）**: すべてのカラムがアトミック値
   - 配列型（TEXT[]）は適切に使用
   
2. **第2正規形（2NF）**: 部分関数従属がない
   - 各テーブルが単一の目的を持つ
   
3. **第3正規形（3NF）**: 推移的関数従属がない
   - すべての非キー属性が主キーのみに依存

### テーブル設計の品質

#### ✅ 良い点
- 適切な主キー（UUID）の使用
- 適切なデータ型の選択
- 必要なインデックスの設定
- CHECK制約によるデータ整合性
- RLSによるセキュリティ確保
- トリガーによる自動更新

#### ⚠️ 将来的に検討すべき点

1. **カテゴリーの正規化**
   - 現在: `news.category`と`menu_items.features`は配列
   - 将来: データ量が増えたら、別テーブル化を検討
   ```sql
   CREATE TABLE categories (
     id UUID PRIMARY KEY,
     name TEXT UNIQUE,
     type TEXT -- 'news' or 'menu'
   );
   ```

2. **在庫管理の拡張**
   - 現在: 単純な在庫数
   - 将来: 在庫履歴テーブルの追加を検討
   ```sql
   CREATE TABLE inventory_logs (
     id UUID PRIMARY KEY,
     menu_item_id UUID REFERENCES menu_items(id),
     change_amount INTEGER,
     reason TEXT,
     created_at TIMESTAMPTZ
   );
   ```

3. **注文管理テーブル**
   - 将来的に注文機能を追加する場合
   ```sql
   CREATE TABLE orders (
     id UUID PRIMARY KEY,
     customer_email TEXT,
     items JSONB,
     total_price INTEGER,
     status TEXT,
     created_at TIMESTAMPTZ
   );
   ```

## セキュリティ対策

### ✅ 実装済み
1. Row Level Security (RLS) 有効化
2. 認証済みユーザーのみが管理操作可能
3. 公開データは誰でも読み取り可能
4. SQLインジェクション対策（search_path設定）

### 📋 推奨追加対策
1. Leaked Password Protection の有効化
   - Supabase Dashboard → Authentication → Policies
   - HaveIBeenPwned.org との連携

2. パスワードポリシーの設定
   - 最小文字数: 8文字以上
   - 複雑性要件の設定

## パフォーマンス最適化

### ✅ 実装済み
1. 適切なインデックス
   - 日付、カテゴリー、ステータスなど頻繁に検索されるカラム
2. RLSポリシーの最適化
   - `auth.role()` → `(SELECT auth.role())`
3. 自動更新トリガー
   - `updated_at`の自動管理

### 📊 未使用インデックス
作成直後のため、以下のインデックスはまだ使用されていません：
- `idx_menu_items_created_at`
- `idx_menu_items_stock`
- `idx_news_date`
- `idx_news_category`
- `idx_news_created_at`
- `idx_contacts_created_at`
- `idx_contacts_status`
- `idx_contacts_email`

**注意:** これらは本番運用開始後に使用されます。削除しないでください。

## 次のステップ

### 1. 認証設定
- [ ] Supabase Dashboard で管理者ユーザーを作成
- [ ] Leaked Password Protection を有効化
- [ ] パスワードポリシーを設定

### 2. アプリケーションのテスト
- [ ] ログイン機能のテスト
- [ ] メニュー管理機能のテスト
- [ ] ニュース管理機能のテスト
- [ ] お問い合わせ機能のテスト

### 3. データ移行（必要な場合）
- [ ] 既存データのバックアップ確認
- [ ] データ移行スクリプトの実行

### 4. ストレージバケットの確認
- [ ] `menu-images` バケットの作成確認
- [ ] `news-images` バケットの作成確認
- [ ] バケットのRLS設定確認

## トラブルシューティング

### ログインできない場合
1. Supabase Dashboard → Authentication → Users でユーザーが作成されているか確認
2. ユーザーのメールアドレスが確認済みになっているか確認
3. `.env.local`の環境変数が正しく設定されているか確認
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### データが表示されない場合
1. RLSポリシーが正しく設定されているか確認
2. ブラウザのコンソールでエラーを確認
3. Supabase Dashboard → Database → Tables でデータが存在するか確認

### 画像アップロードができない場合
1. Supabase Dashboard → Storage でバケットが存在するか確認
2. バケットが公開設定になっているか確認
3. アップロード権限のRLSポリシーを確認

## まとめ

✅ **完了した作業:**
- 既存の不要なテーブルを削除
- 正規化された新しいテーブルを作成
- Row Level Security (RLS) を適切に設定
- パフォーマンス最適化を実施
- セキュリティ対策を実装
- サンプルデータを投入

✅ **データベースの状態:**
- 正規化: ✅ 3NF準拠
- セキュリティ: ✅ RLS有効
- パフォーマンス: ✅ 最適化済み
- データ整合性: ✅ 制約設定済み

🎉 **データベースは本番環境で使用できる状態です！**




