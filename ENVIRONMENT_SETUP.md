# 環境変数設定ガイド

## 1. 設定ファイルの作成

`.env.local.example`を`.env.local`にコピーして、実際の値を設定してください。

```bash
cp .env.local.example .env.local
```

## 2. 必須設定項目

### Supabase関連（データベース・ストレージ）

```env
# SupabaseダッシュボードのProject Settings > APIから取得
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**取得方法:**
1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. 対象のプロジェクトを選択
3. 左メニューの「Settings」→「API」を開く
4. 以下の値をコピー:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY`

### アプリケーション基本設定

```env
# 開発環境
NEXT_PUBLIC_BASE_URL=http://localhost:3007

# 本番環境（例）
NEXT_PUBLIC_BASE_URL=https://futorumeshi.com

# サイト名（変更可能）
NEXT_PUBLIC_SITE_NAME=フトルメシ
```

### 認証設定

```env
# JWT秘密鍵の生成（ターミナルで実行）
openssl rand -base64 32

# 生成された値を設定
JWT_SECRET=生成された32文字の文字列

# 管理者パスワードの変更方法
# 1. Node.jsで新しいパスワードをハッシュ化
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('新しいパスワード', 10).then(console.log)"

# 2. 生成されたハッシュ値を設定
ADMIN_PASSWORD_HASH=$2b$10$xxxxx...
```

## 3. オプション設定項目

### 開発環境

```env
# 環境モード（本番環境では'production'に設定）
NODE_ENV=development

# サーバーポート（デフォルト: 3007）
PORT=3007
```

### 画像アップロード

```env
# 最大ファイルサイズ（5MB = 5 * 1024 * 1024）
MAX_IMAGE_SIZE=5242880

# 許可する画像形式
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif
```

### メール送信（お問い合わせフォーム用）

#### SendGridを使用する場合:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx...
EMAIL_FROM=noreply@futorumeshi.com
EMAIL_TO=contact@futorumeshi.com
```

#### Resendを使用する場合:
```env
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxx...
EMAIL_FROM=noreply@futorumeshi.com
EMAIL_TO=contact@futorumeshi.com
```

### 決済システム（Stripe）

```env
# Stripeダッシュボードから取得
STRIPE_PUBLIC_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Webhook設定後に取得
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### アナリティクス

```env
# Google Analytics 4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Vercel Analytics（Vercelでホスティングする場合）
NEXT_PUBLIC_ANALYTICS_ID=xxxxx
```

### セキュリティ

```env
# CORS設定（複数ドメインを許可する場合）
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3007,https://futorumeshi.com

# APIレート制限（1分あたり）
RATE_LIMIT_PER_MINUTE=60
```

### パフォーマンス

```env
# ISR再検証時間（秒）
# 3600 = 1時間ごとに静的ページを再生成
REVALIDATE_TIME=3600
```

### ログ管理

```env
# ログレベル
# error: エラーのみ
# warn: 警告とエラー
# info: 一般情報、警告、エラー
# debug: すべての詳細情報
LOG_LEVEL=info

# ログ出力先
# console: コンソールのみ
# file: ファイルのみ
# both: 両方
LOG_OUTPUT=console
```

## 4. 環境別の設定

### 開発環境（.env.local）
```env
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3007
LOG_LEVEL=debug
```

### ステージング環境（.env.staging）
```env
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://staging.futorumeshi.com
LOG_LEVEL=info
```

### 本番環境（.env.production）
```env
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://futorumeshi.com
LOG_LEVEL=warn
```

## 5. セキュリティ注意事項

### 公開してはいけない環境変数

以下の環境変数は**絶対に公開しないでください**:

- `SUPABASE_SERVICE_ROLE_KEY` - 管理者権限を持つキー
- `JWT_SECRET` - 認証トークンの署名に使用
- `ADMIN_PASSWORD_HASH` - 管理者パスワード
- `STRIPE_SECRET_KEY` - 決済処理の秘密鍵
- `EMAIL_API_KEY` - メール送信APIキー

### Gitで管理しないファイル

`.gitignore`に以下が含まれていることを確認:

```gitignore
# 環境変数
.env
.env.local
.env.production
.env.staging

# 例外（テンプレートファイル）
!.env.local.example
```

### Vercelでの環境変数設定

1. Vercelダッシュボードにログイン
2. プロジェクトの「Settings」→「Environment Variables」
3. 各環境変数を追加（Development/Preview/Production別に設定可能）

## 6. トラブルシューティング

### 環境変数が読み込まれない

```bash
# Next.jsの開発サーバーを再起動
npm run dev

# または、キャッシュをクリア
rm -rf .next
npm run dev
```

### Supabase接続エラー

1. URLとキーが正しくコピーされているか確認
2. Supabaseプロジェクトが起動しているか確認
3. ネットワーク接続を確認

### 認証エラー

```bash
# JWTトークンの検証
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 新しい値で`JWT_SECRET`を更新
```

## 7. 次のステップ

環境変数の設定が完了したら、以下のコマンドでSupabaseクライアントをインストール:

```bash
npm install @supabase/supabase-js
```

その後、`/lib/supabase.ts`ファイルを作成してクライアントを設定します。