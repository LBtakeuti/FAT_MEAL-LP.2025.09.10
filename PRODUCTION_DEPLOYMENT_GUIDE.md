# 本番環境デプロイメントガイド

このガイドは、本番環境（Vercel）へのデプロイ時に必要な設定と環境変数について説明します。

## 📋 必須環境変数

本番環境で必ず設定する必要がある環境変数は以下の通りです。

### 1. Supabase関連

```bash
# Supabase プロジェクトURL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase 匿名キー（公開可能）
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase サービスロールキー（管理者権限・機密情報）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**取得方法:**
1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左メニューから「Settings」→「API」を開く
4. 「Project URL」をコピー → `NEXT_PUBLIC_SUPABASE_URL` に設定
5. 「anon public」をコピー → `NEXT_PUBLIC_SUPABASE_ANON_KEY` に設定
6. 「service_role」をコピー → `SUPABASE_SERVICE_ROLE_KEY` に設定

⚠️ **警告**: `SUPABASE_SERVICE_ROLE_KEY` は絶対に公開しないでください！

### 2. 認証関連

```bash
# JWT シークレット（ランダムな文字列を生成）
JWT_SECRET=your-secure-random-secret-key-here

# 管理者ユーザー名
ADMIN_USERNAME=your-admin-username

# 管理者パスワードのハッシュ値
ADMIN_PASSWORD_HASH=your-bcrypt-hashed-password
```

**JWT_SECRET の生成方法:**
```bash
# ターミナルで以下を実行
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**パスワードハッシュの生成方法:**
```bash
# bcryptjsを使用してパスワードをハッシュ化
node -e "require('bcryptjs').hash('your-password', 10, (e,h) => console.log(h))"
```

### 3. Node環境設定

```bash
# 本番環境
NODE_ENV=production
```

## 🔒 セキュリティ設定

### 開発環境での認証無効化（オプション）

開発環境で認証を無効にしたい場合のみ、以下を設定：

```bash
# 開発環境のみ（本番環境では設定しない）
ENABLE_AUTH=false
```

⚠️ **重要**: 本番環境では絶対に `ENABLE_AUTH=false` を設定しないでください！

## 🚀 Vercel デプロイ手順

### 1. Vercelプロジェクトの作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. 「Add New...」→「Project」をクリック
3. GitHubリポジトリを選択してインポート

### 2. 環境変数の設定

1. Vercelプロジェクトの「Settings」→「Environment Variables」を開く
2. 上記の必須環境変数をすべて追加
3. 各環境変数について：
   - **Production**: 本番環境で使用
   - **Preview**: プレビュー環境で使用
   - **Development**: ローカル開発で使用

### 3. デプロイ

1. 「Deployments」タブに移動
2. 「Deploy」ボタンをクリック（または自動デプロイを待つ）
3. デプロイが完了したらURLにアクセスして動作確認

## 🔧 パフォーマンス最適化

本プロジェクトには以下の最適化が適用されています：

### 1. Supabaseクライアントのシングルトン化
- メモリリークを防ぐため、クライアントインスタンスを再利用
- コネクション数の削減

### 2. エラーハンドリングとリトライロジック
- データベース接続エラー時に自動リトライ（最大3回）
- タイムアウト発生時のエラーメッセージ改善

### 3. Vercel関数設定
- タイムアウト: 60秒（`vercel.json`で設定）
- APIキャッシュ: 60秒（stale-while-revalidate: 300秒）

### 4. 画像最適化
- Next.js Image最適化を使用
- Supabase Storage対応

## 📊 モニタリング

### エラーログの確認

**Vercel:**
1. プロジェクトの「Logs」タブを開く
2. エラーを検索してトラブルシューティング

**Supabase:**
1. Supabaseダッシュボードの「Logs」を確認
2. データベースクエリの実行時間を監視

### パフォーマンスメトリクス

- Vercel Analyticsで以下を監視：
  - Core Web Vitals
  - ページ読み込み時間
  - APIレスポンス時間

## 🛠️ トラブルシューティング

### エラー: "一定時間経つとエラーになる"

**原因:**
- Supabaseクライアントの非効率的な管理
- コネクションプールの枯渇
- タイムアウト設定が短い

**解決策:**
✅ 本ガイドの修正をすべて適用済み
- Supabaseクライアントのシングルトン化
- リトライロジックの追加
- タイムアウトを60秒に延長

### エラー: "画像が表示されない"

**原因:**
- Supabase StorageのドメインがNext.js設定に含まれていない

**解決策:**
✅ `next.config.ts`に`*.supabase.co`を追加済み

### エラー: "認証が動作しない"

**原因:**
- 環境変数の未設定
- JWTシークレットの不一致

**解決策:**
1. すべての認証関連環境変数が設定されているか確認
2. `JWT_SECRET`が本番環境と一致しているか確認

## 📝 チェックリスト

デプロイ前に以下を確認してください：

- [ ] Supabase環境変数が設定されている
- [ ] JWT_SECRETが設定されている（ランダムな値）
- [ ] ADMIN_USERNAMEとADMIN_PASSWORD_HASHが設定されている
- [ ] 本番環境で`ENABLE_AUTH=false`が設定されていない
- [ ] Vercelでビルドが成功している
- [ ] 管理画面にログインできる
- [ ] メニューと新着情報が正しく表示される
- [ ] 画像が正しく読み込まれる

## 🔐 セキュリティベストプラクティス

1. **環境変数を絶対にコミットしない**
   - `.env*`ファイルは`.gitignore`に含まれています
   
2. **強力なパスワードを使用する**
   - 最低12文字以上
   - 英数字と記号を組み合わせる

3. **定期的にシークレットをローテーション**
   - JWT_SECRETは3〜6ヶ月ごとに変更
   - 管理者パスワードも定期的に変更

4. **HTTPSのみを使用**
   - Vercelは自動的にHTTPSを有効化

## 📞 サポート

問題が発生した場合：
1. Vercelのログを確認
2. Supabaseのログを確認
3. このガイドのトラブルシューティングセクションを参照
4. 開発チームに連絡

---

**最終更新:** 2025年11月
**バージョン:** 1.0



