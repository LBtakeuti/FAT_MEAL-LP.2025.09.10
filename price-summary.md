# ふとるめし 価格サマリー

> **目的**: 価格変更時に変更が必要なファイルと箇所を一覧で把握するためのリファレンスドキュメント
> **最終更新**: 2026-03-03

---

## Section 1: 概要と使い方

### このドキュメントの目的

プランの価格を変更する際、複数ファイルへの変更漏れを防ぐためのチェックリストです。
価格定義が複数ファイルに分散しており、1ファイルだけ変更するとトップページ表示と実際の課金額が乖離するリスクがあります。

### 価格変更時の手順

1. **Section 2** で変更対象プランの現在価格を確認する
2. **Section 3** で変更が必要なすべてのファイルと行番号を確認する
3. 各ファイルを開いて同じ値を変更する（Section 3の表を上から順番にチェック）
4. Stripeダッシュボードで新しいPrice IDを発行した場合は **Section 4** の環境変数も更新する
5. **Section 7** の既知の不整合も確認し、必要に応じて合わせて修正する
6. このドキュメントのテーブルを最新の価格に更新する

### ⚠️ 重要な注意事項

- **ソース・オブ・トゥルース**（実際のCheckout金額）: `app/purchase/page.tsx` と `lib/subscription-schedule.ts`
- `components/sections/SubscriptionSection.tsx` は **異なる価格体系**（旧来の価格）を使用しており、実際の課金額と一致していない（Section 7参照）

---

## Section 2: プラン価格マスターテーブル

> 下表の価格は `app/purchase/page.tsx` と `lib/subscription-schedule.ts` の定義に基づく。
> **Phase1** = 初回限定・30%OFF・送料無料
> **Phase2** = 2ヶ月目以降・15%OFF・送料¥1,500/月（フラット・配送回数によらず固定）
> **アンカー価格** = 打ち消し線で表示する定価（= 個数 × ¥1,500）

| プランID | プラン名 | Phase1商品 | Phase1送料 | Phase1合計 | Phase2商品 | Phase2送料 | Phase2合計 | アンカー価格 | 1食あたり(Ph2) |
|---------|---------|:----------:|:----------:|:----------:|:----------:|:----------:|:----------:|:----------:|:------------:|
| `trial-6` | お試し6個セット | ¥4,200 | ¥1,500 | ¥5,700 | — | — | — | — | ¥950 |
| `subscription-monthly-12` | 6食月額プラン | ¥4,980 | ¥0 | ¥4,980 | ¥7,650 | ¥1,500 | ¥9,150 | ¥9,000 | ¥1,525 |
| `subscription-monthly-24` | 12食月額プラン | ¥12,600 | ¥0 | ¥12,600 | ¥15,300 | ¥1,500 | ¥16,800 | ¥18,000 | ¥1,400 |
| `subscription-monthly-48` | 24食月額プラン | ¥25,200 | ¥0 | ¥25,200 | ¥30,600 | ¥1,500 | ¥32,100 | ¥36,000 | ¥1,337 |

**合計金額の計算式:**
- Phase2合計 = Phase2商品 + ¥1,500（フラット送料）
- アンカー価格 = 食数 × ¥1,500（例: 6食 → ¥9,000、12食 → ¥18,000）

---

## Section 3: ファイル別変更箇所マップ

---

### trial-6（お試し6個セット）

| 変更したい価格 | ファイル | 行番号 | 変数名/定数名 |
|-------------|--------|:------:|-------------|
| 商品価格（¥4,200） | `app/purchase/page.tsx` | 51 | `price: 4200` |
| 送料（¥1,500） | `app/purchase/page.tsx` | 52 | `shippingFee: 1500` |
| 合計（¥5,700） | `app/purchase/page.tsx` | 53 | `totalPrice: 5700` |
| 1食あたり（¥950） | `app/purchase/page.tsx` | 55 | `perMeal: 950` |
| 表示価格（¥5,700） | `components/sections/TrialSection.tsx` | 40 | JSXテキスト `¥5,700` |
| Stripe商品Price ID | `app/api/checkout/route.ts` | 173 | `process.env.STRIPE_PRICE_TRIAL_6SET` |
| Stripe送料Price ID | `app/api/checkout/route.ts` | 183 | `process.env.STRIPE_SHIPPING_PRICE_TRIAL` |
| 初回コミッション（¥500） | `app/api/webhook/stripe/route.ts` | 16 | `INITIAL_COMMISSION['trial-6']` |

---

### subscription-monthly-12（6食月額プラン）

| 変更したい価格 | ファイル | 行番号 | 変数名/定数名 |
|-------------|--------|:------:|-------------|
| **purchase/page.tsx（購入ページ・Checkout定義）** | | | |
| アンカー価格（¥9,000） | `app/purchase/page.tsx` | 74 | `anchorPrice: 9000` |
| Phase1商品（¥4,980） | `app/purchase/page.tsx` | 65 | `price: 4980` |
| Phase1送料（¥0） | `app/purchase/page.tsx` | 66 | `shippingFee: 0` |
| Phase1合計（¥4,980） | `app/purchase/page.tsx` | 67 | `totalPrice: 4980` |
| Phase1 1食あたり（¥830） | `app/purchase/page.tsx` | 69 | `perMeal: 830` |
| Phase2商品（¥7,650） | `app/purchase/page.tsx` | 75 | `phase2Price: 7650` |
| Phase2送料（¥1,500） | `app/purchase/page.tsx` | 76 | `phase2ShippingFee: 1500` |
| Phase2合計（¥9,150） | `app/purchase/page.tsx` | 77 | `phase2Total: 9150` |
| Phase2 1食あたり（¥1,525） | `app/purchase/page.tsx` | 78 | `phase2PerMeal: 1525` |
| **lib/subscription-schedule.ts（バックエンド・スケジュール計算）** | | | |
| Phase2商品（¥7,650） | `lib/subscription-schedule.ts` | 37 | `product_price: 7650` |
| Phase2配送あたり送料（¥1,500） | `lib/subscription-schedule.ts` | 38 | `shipping_fee_per_delivery: 1500` |
| Phase2月額フラット送料（¥1,500） | `lib/subscription-schedule.ts` | 39 | `monthly_shipping_fee: 1500` |
| Phase2月額合計（¥9,150） | `lib/subscription-schedule.ts` | 40 | `monthly_total: 9150` |
| アンカー価格（¥9,000） | `lib/subscription-schedule.ts` | 41 | `anchor_price: 9000` |
| **SubscriptionSection.tsx（Phase2価格に統一済み）** | | | |
| 打ち消し前価格（¥9,000） | `components/sections/SubscriptionSection.tsx` | 14 | `originalProductPrice: 9000` |
| 商品価格（¥7,650） | `components/sections/SubscriptionSection.tsx` | 15 | `productPrice: 7650` |
| 割引額（¥1,350） | `components/sections/SubscriptionSection.tsx` | 16 | `discount: 1350` |
| 月額表示価格（¥7,650） | `components/sections/SubscriptionSection.tsx` | 17 | `monthlyPrice: 7650` |
| 表示送料（¥1,500） | `components/sections/SubscriptionSection.tsx` | 18 | `shippingFee: 1500` |
| 1食あたり表示（¥1,275） | `components/sections/SubscriptionSection.tsx` | 22 | `pricePerMeal: 1275` |
| **コミッション** | | | |
| 初回コミッション（¥1,000） | `app/api/webhook/stripe/route.ts` | 17 | `INITIAL_COMMISSION['subscription-monthly-12']` |
| 継続コミッション（¥300/月） | `app/api/webhook/stripe/route.ts` | 21 | `RECURRING_COMMISSION['subscription-monthly-12']` |

---

### subscription-monthly-24（12食月額プラン）

| 変更したい価格 | ファイル | 行番号 | 変数名/定数名 |
|-------------|--------|:------:|-------------|
| **purchase/page.tsx（購入ページ・Checkout定義）** | | | |
| アンカー価格（¥18,000） | `app/purchase/page.tsx` | 93 | `anchorPrice: 18000` |
| Phase1商品（¥12,600） | `app/purchase/page.tsx` | 84 | `price: 12600` |
| Phase1送料（¥0） | `app/purchase/page.tsx` | 85 | `shippingFee: 0` |
| Phase1合計（¥12,600） | `app/purchase/page.tsx` | 86 | `totalPrice: 12600` |
| Phase1 1食あたり（¥1,050） | `app/purchase/page.tsx` | 88 | `perMeal: 1050` |
| Phase2商品（¥15,300） | `app/purchase/page.tsx` | 94 | `phase2Price: 15300` |
| Phase2送料（¥1,500） | `app/purchase/page.tsx` | 95 | `phase2ShippingFee: 1500` |
| Phase2合計（¥16,800） | `app/purchase/page.tsx` | 96 | `phase2Total: 16800` |
| Phase2 1食あたり（¥1,400） | `app/purchase/page.tsx` | 97 | `phase2PerMeal: 1400` |
| **lib/subscription-schedule.ts（バックエンド）** | | | |
| Phase2商品（¥15,300） | `lib/subscription-schedule.ts` | 47 | `product_price: 15300` |
| Phase2配送あたり送料（¥1,500） | `lib/subscription-schedule.ts` | 48 | `shipping_fee_per_delivery: 1500` |
| Phase2月額フラット送料（¥1,500） | `lib/subscription-schedule.ts` | 49 | `monthly_shipping_fee: 1500` |
| Phase2月額合計（¥16,800） | `lib/subscription-schedule.ts` | 50 | `monthly_total: 16800` |
| アンカー価格（¥18,000） | `lib/subscription-schedule.ts` | 51 | `anchor_price: 18000` |
| **SubscriptionSection.tsx（Phase2価格に統一済み）** | | | |
| 打ち消し前価格（¥18,000） | `components/sections/SubscriptionSection.tsx` | 28 | `originalProductPrice: 18000` |
| 商品価格（¥15,300） | `components/sections/SubscriptionSection.tsx` | 29 | `productPrice: 15300` |
| 割引額（¥2,700） | `components/sections/SubscriptionSection.tsx` | 30 | `discount: 2700` |
| 月額表示価格（¥15,300） | `components/sections/SubscriptionSection.tsx` | 31 | `monthlyPrice: 15300` |
| 表示送料（¥1,500） | `components/sections/SubscriptionSection.tsx` | 32 | `shippingFee: 1500` |
| 1食あたり表示（¥1,400） | `components/sections/SubscriptionSection.tsx` | 36 | `pricePerMeal: 1400` |
| **StatsSection（修正済み・Phase2送料込み合計）** | | | |
| 比較表の12食金額（¥16,800） | `components/sections/StatsSection/constants.ts` | 17 | `FUTORUMESHI_BREAKDOWN.items[0]` |
| **コミッション** | | | |
| 初回コミッション（¥2,000） | `app/api/webhook/stripe/route.ts` | 18 | `INITIAL_COMMISSION['subscription-monthly-24']` |
| 継続コミッション（¥500/月） | `app/api/webhook/stripe/route.ts` | 22 | `RECURRING_COMMISSION['subscription-monthly-24']` |

---

### subscription-monthly-48（24食月額プラン）

| 変更したい価格 | ファイル | 行番号 | 変数名/定数名 |
|-------------|--------|:------:|-------------|
| **purchase/page.tsx（購入ページ・Checkout定義）** | | | |
| アンカー価格（¥36,000） | `app/purchase/page.tsx` | 112 | `anchorPrice: 36000` |
| Phase1商品（¥25,200） | `app/purchase/page.tsx` | 103 | `price: 25200` |
| Phase1送料（¥0） | `app/purchase/page.tsx` | 104 | `shippingFee: 0` |
| Phase1合計（¥25,200） | `app/purchase/page.tsx` | 105 | `totalPrice: 25200` |
| Phase1 1食あたり（¥1,050） | `app/purchase/page.tsx` | 107 | `perMeal: 1050` |
| Phase2商品（¥30,600） | `app/purchase/page.tsx` | 113 | `phase2Price: 30600` |
| Phase2送料（¥1,500） | `app/purchase/page.tsx` | 114 | `phase2ShippingFee: 1500` |
| Phase2合計（¥32,100） | `app/purchase/page.tsx` | 115 | `phase2Total: 32100` |
| Phase2 1食あたり（¥1,337） | `app/purchase/page.tsx` | 116 | `phase2PerMeal: 1337` |
| **lib/subscription-schedule.ts（バックエンド）** | | | |
| Phase2商品（¥30,600） | `lib/subscription-schedule.ts` | 57 | `product_price: 30600` |
| Phase2配送あたり送料（¥1,500） | `lib/subscription-schedule.ts` | 58 | `shipping_fee_per_delivery: 1500` |
| Phase2月額フラット送料（¥1,500） | `lib/subscription-schedule.ts` | 59 | `monthly_shipping_fee: 1500` |
| Phase2月額合計（¥32,100） | `lib/subscription-schedule.ts` | 60 | `monthly_total: 32100` |
| アンカー価格（¥36,000） | `lib/subscription-schedule.ts` | 61 | `anchor_price: 36000` |
| **SubscriptionSection.tsx（Phase2価格に統一済み）** | | | |
| 打ち消し前価格（¥36,000） | `components/sections/SubscriptionSection.tsx` | 42 | `originalProductPrice: 36000` |
| 商品価格（¥30,600） | `components/sections/SubscriptionSection.tsx` | 43 | `productPrice: 30600` |
| 割引額（¥5,400） | `components/sections/SubscriptionSection.tsx` | 44 | `discount: 5400` |
| 月額表示価格（¥30,600） | `components/sections/SubscriptionSection.tsx` | 45 | `monthlyPrice: 30600` |
| 表示送料（¥1,500） | `components/sections/SubscriptionSection.tsx` | 46 | `shippingFee: 1500` |
| 1食あたり表示（¥1,275） | `components/sections/SubscriptionSection.tsx` | 50 | `pricePerMeal: 1275` |
| **コミッション** | | | |
| 初回コミッション（¥4,000） | `app/api/webhook/stripe/route.ts` | 19 | `INITIAL_COMMISSION['subscription-monthly-48']` |
| 継続コミッション（¥800/月） | `app/api/webhook/stripe/route.ts` | 23 | `RECURRING_COMMISSION['subscription-monthly-48']` |

---

## Section 4: Stripe Price ID 環境変数マッピング

> Stripeダッシュボードで価格変更 → 新Price ID発行 → 以下の環境変数を更新する

| 環境変数名 | 用途 | 対応金額 | env.example行 |
|-----------|------|---------|:------------:|
| `STRIPE_PRICE_TRIAL_6SET` | お試し6個セット商品価格 | ¥4,200 | 追記済み |
| `STRIPE_SHIPPING_PRICE_TRIAL` | お試し送料 | ¥1,500 | 追記済み |
| `STRIPE_SHIPPING_PRICE_12` | Phase2有料送料 | ¥1,500 | 追記済み |
| `STRIPE_SUBSCRIPTION_PRICE_12_PHASE1` | 6食プラン Phase1商品 | ¥4,980 | 47 |
| `STRIPE_SUBSCRIPTION_PRICE_24_PHASE1` | 12食プラン Phase1商品 | ¥12,600 | 48 |
| `STRIPE_SUBSCRIPTION_PRICE_48_PHASE1` | 24食プラン Phase1商品 | ¥25,200 | 49 |
| `STRIPE_SUBSCRIPTION_PRICE_12_PHASE2` | 6食プラン Phase2商品 | ¥7,650 | 53 |
| `STRIPE_SUBSCRIPTION_PRICE_24_PHASE2` | 12食プラン Phase2商品 | ¥15,300 | 54 |
| `STRIPE_SUBSCRIPTION_PRICE_48_PHASE2` | 24食プラン Phase2商品 | ¥30,600 | 55 |
| `STRIPE_SHIPPING_PRICE_FREE` | サブスク初回送料（Phase1・¥0 recurring） | ¥0 | 59 |

### ✅ env.example の不整合（修正済み・2026-03-03）

- `STRIPE_PRICE_TRIAL_6SET`: `env.example` に追記済み
- `STRIPE_SHIPPING_PRICE_TRIAL`: `env.example` に追記済み
- `STRIPE_SHIPPING_PRICE_12`: `env.example` に追記済み

---

## Section 5: コミッション設定

> アンバサダー紹介プログラムの報酬金額
> 定義ファイル: `app/api/webhook/stripe/route.ts` (Lines 14–24)

### 初回コミッション（INITIAL_COMMISSION）

| プラン | 金額 | 行番号 |
|-------|:----:|:------:|
| `trial-6` | ¥500 | 16 |
| `subscription-monthly-12` | ¥1,000 | 17 |
| `subscription-monthly-24` | ¥2,000 | 18 |
| `subscription-monthly-48` | ¥4,000 | 19 |

### 継続コミッション（RECURRING_COMMISSION）

| プラン | 金額/月 | 行番号 |
|-------|:-------:|:------:|
| `subscription-monthly-12` | ¥300 | 21 |
| `subscription-monthly-24` | ¥500 | 22 |
| `subscription-monthly-48` | ¥800 | 23 |

> `trial-6` には継続コミッションなし（一回購入のため）

---

## Section 6: 比較表（StatsSection）用の価格

> `components/sections/StatsSection/constants.ts` で定義
> 変更時に見落としやすい独立した価格定義

| 表示内容 | 値 | 行番号 | 定数名 |
|---------|:--:|:------:|-------|
| 競合補食費（下限） | 約9,000円/月 | 11 | `SNACK_BREAKDOWN.note` |
| 競合補食費（上限） | 約24,000円/月 | 11 | `SNACK_BREAKDOWN.note` |
| ふとるめし比較金額 | ¥16,800 | 15, 17 | `FUTORUMESHI_BREAKDOWN.title`, `.items[0]` |
| 電気代（補足） | 約100円/月 | 18 | `FUTORUMESHI_BREAKDOWN.items[1]` |

> **注意**: `FUTORUMESHI_BREAKDOWN` は¥16,800（送料込）に修正済み

---

## Section 7: 価格不整合メモ

---

### ~~不整合 1: 6食プランの商品価格~~ ✅ 修正済み（2026-03-03）

`SubscriptionSection.tsx` を Phase2 価格（¥7,650）に統一。

---

### ~~不整合 2: 12食プランの送料計算方式~~ ✅ 修正済み（2026-03-03）

`SubscriptionSection.tsx` の送料を¥3,000→¥1,500（フラット）に修正。

---

### ~~不整合 3: 24食プランの送料計算方式~~ ✅ 修正済み（2026-03-03）

`SubscriptionSection.tsx` の送料を¥6,000→¥1,500（フラット）に修正。

---

### ~~不整合 4: StatsSection（比較表）の12食プラン金額~~ ✅ 修正済み（2026-03-03）

`StatsSection/constants.ts` を¥16,800（送料込）に更新。

---

### 不整合 5: env.example のPrice ID命名

| コード内の変数名 | env.example上の変数名 | 状態 |
|---------------|-------------------|------|
| `STRIPE_PRICE_TRIAL_6SET` | `STRIPE_PRICE_TRIAL_6SET_TEST` / `..._LIVE` | ❌ 不一致 |
| `STRIPE_SHIPPING_PRICE_TRIAL` | （記載なし） | ❌ 未定義 |

---

## 参考: ファイル一覧

| ファイル | 役割 |
|--------|------|
| `components/sections/SubscriptionSection.tsx` | トップページ定期プランカード（⚠️ 旧価格体系） |
| `components/sections/TrialSection.tsx` | トップページお試しプランバナー |
| `components/sections/StatsSection/constants.ts` | 競合比較表のTooltipデータ |
| `app/purchase/page.tsx` | 購入ページのプラン定義（Phase1/2含む・ソース・オブ・トゥルース） |
| `lib/subscription-schedule.ts` | バックエンドのプラン構成・配送スケジュール計算 |
| `app/api/checkout/route.ts` | Stripe Checkout Session作成ロジック・Price ID取得 |
| `app/api/webhook/stripe/route.ts` | Phase切替・コミッション金額定義 |
| `env.example` | 環境変数テンプレート（Stripe Price IDの変数名一覧） |
