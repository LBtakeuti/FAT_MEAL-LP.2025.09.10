# CLAUDE.md — AI 開発者向け参照ガイド

このファイルは、AI（Claude 等）がこのリポジトリのコードを読んで開発・修正する際に **必ず最初に参照する** ドキュメントです。
人間の開発者向けの環境構築手順は `README.md` を参照してください。

## プロジェクト概要

「ふとるめし」公式 LP・EC サイト。Next.js 15 / React 19 / TypeScript / Tailwind CSS / Supabase / Stripe / Resend。

- 本番 URL: https://www.futorumeshi.com
- パッケージマネージャ: **pnpm 9 系**（npm 禁止、`package-lock.json` は触らない）
- ローカル開発: ポート 3000（`pnpm dev`）または Docker のポート 3010（`docker compose up -d`）。並走可

---

## 最重要：レガシーコードを「現役の実装」と誤読しないこと

このリポジトリには、過去の実装の名残（レガシー）が一部残っています。**新規開発時に以下を絶対に参考にしないでください。**

### 1. 旧プラン体系の lookup は「既存契約者処理のため」だけに残っている

`subscription-monthly-12`、`subscription-monthly-6` のような旧プランIDは、以下のファイルで lookup table として意図的に残されています：

- `lib/subscription-schedule.ts`
- `app/api/webhook/stripe/route.ts`
- `app/api/admin/subscriptions/export-csv/route.ts`
- `app/api/admin/subscriptions/delivery-csv/route.ts`
- `app/api/admin/delivery/calendar/route.ts`
- `app/api/admin/referrers/stats/route.ts`

これらは **既存契約者の継続処理（CSV出力・コミッション計算・カレンダー表示等）に必要なため残しています**。新規実装で参考にしてはいけません。

### 2. 新規開発で使う「現役のプラン体系」

| 現役 ID | 表示名（管理画面/CSV） | 内容 |
|---------|----------------------|------|
| `trial-6` | ふとるめしお試し6個セット | お試し（単発購入） |
| `sub-6` | 【定期】ふとるめし6食プラン N回目 | 6食定期 |
| `sub-12` | 【定期】ふとるめし12食プラン N回目 | 12食定期 |

旧 ID（`subscription-monthly-12` / `subscription-monthly-6` / `plan-6` / `plan-12` / `plan-18` / `monthly-12` 等）は新規実装では使わない。

### 3. 商品名の表記ルール

- お試し: 「**ふとるめしお試し6個セット**」（「6食セット」と表記している箇所が一部残るが順次「6個セット」に統一中）
- 6食定期: 「**【定期】ふとるめし6食プラン N回目**」
- 12食定期: 「**【定期】ふとるめし12食プラン N回目**」

「N回目」は `subscription_deliveries.status` が `shipped` または `delivered` のレコード数 + 1 を使う（CSV出力・管理画面で統一）。

### 4. 既知の「中途半端なレガシー」— AI は変更しないこと

将来整理予定の箇所です。指示がない限り触らないでください：

- `app/api/webhook/stripe/route.ts` の `resolveLegacyPlanId`：コメントは「旧IDを新IDに正規化」と書かれているが、実体は `return planId` のみ（no-op）
- `app/api/checkout/route.ts`：旧 Stripe Checkout Session 実装。フロントからの呼び出しは 0 件だが `middleware.ts` の matcher に残っている。**新規決済は必ず `app/api/payment/create-intent/` を使うこと**
- `app/api/inventory/check/route.ts` の `plan-6` / `plan-12` / `plan-18` レスポンス：呼び出し元（`PurchaseFlow.tsx`）が値を破棄しているため実質未使用
- `types/index.ts` の `InventoryCheckResult` 型：実態と乖離（上記と連動）
- `app/api/cron/backfill-broken-subs/` と `backfill-renewal-deliveries/`：ワンショット補完用 cron。完了確認後に削除予定
- `types/index.ts` の CRUD 型群（`MenuItemCreate` / `OrderStatus` / `PaginationInfo` 等）：未参照だが慎重判断中

---

## アーキテクチャ概要

### ディレクトリ構成

```
app/                  Next.js App Router
  api/
    payment/          新Stripe Elements決済（idempotencyKey 必須）
    webhook/stripe/   Stripe Webhook受信（変更要注意）
    admin/            管理画面API
    cron/             Vercel Cron API
  admin/              管理画面UI
  ...
components/
  sections/           LP のセクション（HeroSection / SubscriptionSection / FaqSection 等）
  pages/              ページ単位の組み立て（HomeContent 等）
  ui/                 shadcn/ui ベースの共通UI
  admin/              管理画面コンポーネント
  layout/             ヘッダー・フッター
  purchase/           購入フロー（PurchaseFlow.tsx）
lib/                  ライブラリ
  auth.ts             認証
  subscription-schedule.ts プラン体系・配送スケジュール
  ...
types/                型定義
sql/                  SQL マイグレーション
e2e/                  Playwright E2E
```

### 認証関数の正しい使い分け

新規実装では必ず**複数形版**を使うこと（単数形の旧版は削除済み）：

- `checkIsAdminByEmail(email)` を使う
- `getSessionTokens()` を使う
- `setAuthCookies(response, ...)` を使う
- `verifyAdminToken(token)` を使う（`verifyAuth` は内部用ヘルパー）

### Stripe 決済の実装ルール

1. **新規決済は必ず `app/api/payment/create-intent/` 経由**（Stripe Elements + idempotency key 方式）。旧 `app/api/checkout/` は使わない
2. **重複サブスクリプション防止**: `stripe.subscriptions.create()` の第2引数に必ず以下を指定：
   ```ts
   { idempotencyKey: `subscription_create_${setupIntentId}` }
   ```
3. **Webhook（`app/api/webhook/stripe/route.ts`）の API バージョン指定箇所は変更しない**

### 配送・CSV のルール

- 配送回数 N: `subscription_deliveries.status` が `shipped` または `delivered` のレコード数 + 1
- CSV 出荷予定日: CSV ダウンロード時点の JST 今日固定（カレンダー画面の日付パラメータは無視）
- TikTok Shop 連携は `lib/tiktok-shop-csv.ts` で処理（SKU 命名規則あり）

### 紹介コードのフォーマット

- ルール: `/^[A-Z0-9]{4,12}$/`（大文字英字 + 数字のみ、4〜12 文字、ハイフン不可）
- 既存コード例: `TAKEUCHI` / `MIMORI` / `MATUSHITA` / `NAKAKEN` / `NAGASE`

---

## 編集禁止 / 触らないファイル

| ファイル | 理由 |
|---------|------|
| `.env.local` | 環境変数。コミット禁止 |
| `package-lock.json` | pnpm 統一のため更新しない |
| `app/api/webhook/stripe/route.ts` の Stripe API バージョン指定 | Stripe との互換性 |
| `lib/subscription-schedule.ts` の `subscription-monthly-12` 関連 lookup | 既存契約者処理に必須 |
| `sql/` 配下の既存マイグレーション | 適用済みのため再編集禁止（新規追加のみ） |

---

## よく使うコマンド

```bash
pnpm dev               # 開発サーバ（ポート 3000）
pnpm build             # 本番ビルド確認
pnpm lint              # ESLint
npx tsc --noEmit       # 型チェック
npx playwright test    # E2E スモークテスト
docker compose up -d   # Docker 起動（ポート 3010）
```

---

## チーム開発の運用（Agent Teams）

このプロジェクトは Claude Code の Agent Teams 機能で **1 リード + 5 メート構成** で開発しています：

- **設計メート（リード）**: keitakeuchi の窓口。設計判断・ドキュメント・FB 管理
- **開発メート（ハブ）**: 実装・コミット（**git 操作はこのメートのみ**）
- **デザインメート**: UI デザインシステム準拠チェック
- **レビューメート**: lint / 型 / build / コードレビュー
- **ユニットテストメート**: ユニットテスト作成・実行
- **E2E テストメート**: E2E シナリオ判定・テスト実行

役割定義は `~/.claude/team-prompts/` 配下（リポジトリ外、ユーザのホーム配下）。
