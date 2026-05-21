# ふとるめし LP（futorumeshi-lp）

ふとるめしの公式LP・ECサイト。Next.js 15 + React 19 + TypeScript + Tailwind CSS / Supabase / Stripe / Resend で構築。

## 動作環境

- Node.js 20 系
- pnpm 9 系（npm は使用しない。`package-lock.json` は触らない）
- Docker Desktop（Docker起動を使う場合のみ）

## 環境変数

`.env.local` をプロジェクトルートに配置する。必要キーは `.env.example` を参照。

主なグループ：

- サイト設定（`NEXT_PUBLIC_SITE_URL` 等）
- Supabase（`NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 等）
- Stripe（`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` 等）
- Resend（`RESEND_API_KEY` / `RESEND_FROM_EMAIL`）
- Slack（`SLACK_*`）

## 起動方法

ローカル直起動（ポート 3000）と Docker（ポート 3010）の **並走運用** が可能。

### A. Docker 起動（ポート 3010）

```bash
# 起動（バックグラウンド）
docker compose up -d

# ログ確認
docker compose logs -f

# 停止
docker compose down

# Dockerfile を変更した場合のみ再ビルド
docker compose build
```

ブラウザで http://localhost:3010 を開く。

初回起動は `pnpm install` が走るため 1〜2 分かかる。2回目以降は node_modules ボリュームが残るため高速。

### B. ローカル直起動（ポート 3000）

```bash
# 依存インストール
pnpm install

# 開発サーバ起動
pnpm dev
```

ブラウザで http://localhost:3000 を開く。

## よく使うコマンド

```bash
# Lint
pnpm lint

# 本番ビルド確認
pnpm build

# E2E スモークテスト（Playwright）
npx playwright test
```

## ディレクトリ構成（概要）

```
app/                   Next.js App Router
  api/                 API ルート（決済 / Webhook / 管理）
  admin/               管理画面
  ...
components/            React コンポーネント
  sections/            LP のセクション単位
  pages/               ページ単位の組み立て
  ui/                  共通UIコンポーネント
lib/                   ライブラリ（Supabase / Stripe / Slack 等）
hooks/                 React Hooks
types/                 型定義
public/                静的アセット
sql/                   SQL マイグレーション
e2e/                   Playwright E2E テスト
```

## 開発フロー

- パッケージマネージャは **pnpm に統一**。`npm install` は禁止（`package-lock.json` を更新しない）
- 環境変数は `.env.local` に配置し、コミットしない
- E2E テストは本番 DB に対して実行する場合があるため、**新規データ作成テストはクリーンアップ必須**

## デプロイ

- Vercel に自動デプロイ（`main` ブランチへのマージで本番反映）
- 本番URL: https://www.futorumeshi.com

## トラブルシューティング

### Docker 起動時に `.env.local` パースエラーが出る

`docker-compose.yml` では `env_file: .env.local` を使わず、Next.js 自身に `.env.local` を読み込ませる方式を採用している。これにより GA_PRIVATE_KEY 等の `\n` リテラルを含む値も正しく動作する。

### ポート 3010 / 3000 が使用中

```bash
# 使用中プロセス確認
lsof -nP -iTCP:3010 -sTCP:LISTEN
lsof -nP -iTCP:3000 -sTCP:LISTEN
```
