# ふとるめし 価格サマリー

> **目的**: 価格変更時に変更が必要なファイルと箇所を一覧で把握するためのリファレンス
> **構成**: 新3プラン体系（trial-6 / sub-6 / sub-12）・月1回配送・段階割引なし

---

## Section 1: プラン価格マスター

| プランID | プラン名 | 商品 | 送料 | 月額合計 | 1食 | 種別 |
|---|---|---:|---:|---:|---:|---|
| `trial-6` | お試しプラン | ¥4,200 | ¥1,500 | **¥5,700** | ¥950 | 一回購入 |
| `sub-6` | 6食プラン | ¥3,000 | ¥1,500 | **¥4,500** | ¥750 | 月額サブスク |
| `sub-12` | 12食プラン | ¥6,000 | ¥1,500 | **¥7,500** | ¥625 | 月額サブスク |

### Legacy（既存契約者のみ・新規発行なし）

| プランID | 月額 | 備考 |
|---|---:|---|
| `subscription-monthly-12` | ¥9,150 | 旧12食月額プラン（Phase1¥4,980 → Phase2¥9,150 の Subscription Schedule が Stripe 内で動作中）。新規購入は `sub-12` を使用 |

---

## Section 2: 価格変更時のファイル一覧

### 1. プラン定義（バックエンド・配送スケジュール）
`lib/subscription-schedule.ts`
- `PLAN_CONFIGS` 内の `product_price` / `monthly_shipping_fee` / `monthly_total` を変更

### 2. プラン表示（フロント・購入フロー）
`components/purchase/PurchaseFlow.tsx`
- `planOptions` 配列内の `price` / `shippingFee` / `totalPrice` / `perMeal` を変更

### 3. トップページの定期プランカード
`components/sections/SubscriptionSection.tsx`
- `subscriptionPlans` 配列内の表示金額を変更

### 4. お試しプランバナー
`components/sections/TrialSection.tsx`
- JSXテキスト内の `¥5,700` 等を変更

### 5. 買い切り API の価格定義
`app/api/payment/create-intent/route.ts`
- `PLAN_PRICES['trial-6']` の `amount` / `shipping` を変更
- `SUBSCRIPTION_MONTHLY_TOTAL['sub-6']` / `['sub-12']` を変更（フロント表示用）

### 6. コミッション
`app/api/webhook/stripe/route.ts`
- `INITIAL_COMMISSION` / `RECURRING_COMMISSION` の各プラン金額を変更

### 7. Stripe Price ID（金額変更時は新Price発行→env更新）
`.env.example` および本番環境変数（Vercel等）

---

## Section 3: Stripe Price ID 環境変数マッピング

| 環境変数 | 用途 | 金額 |
|---|---|---:|
| `STRIPE_PRICE_TRIAL_6SET` | お試しプラン 商品 | ¥4,200 |
| `STRIPE_SHIPPING_PRICE_TRIAL` | お試しプラン 送料 | ¥1,500 |
| `STRIPE_PRICE_SUB6_PRODUCT` | 6食プラン 商品（recurring monthly） | ¥3,000/月 |
| `STRIPE_PRICE_SUB12_PRODUCT` | 12食プラン 商品（recurring monthly） | ¥6,000/月 |
| `STRIPE_PRICE_SUB_SHIPPING` | サブスク送料（recurring monthly・共通） | ¥1,500/月 |

### Legacy（DEPRECATED・残置）
| 環境変数 | 用途 |
|---|---|
| `STRIPE_SUBSCRIPTION_PRICE_12_PHASE1` | 旧12食 Phase1 商品 ¥4,980（既存契約者の Stripe Subscription Schedule が参照中） |
| `STRIPE_SUBSCRIPTION_PRICE_12_PHASE2` | 旧12食 Phase2 商品 ¥7,650（同上） |
| `STRIPE_SHIPPING_PRICE_FREE` | 旧Phase1 送料¥0（同上） |
| `STRIPE_SHIPPING_PRICE` | 旧Phase2 送料¥1,500（同上） |

> ⚠️ Legacy env は本番では削除しないこと。既存 12食契約者の毎月の請求が Stripe 側で旧 Price ID に紐付いて動作している。

---

## Section 4: コミッション設定

定義ファイル: `app/api/webhook/stripe/route.ts`（および参照用に `app/api/admin/referrers/stats/route.ts`）

### 初回コミッション（INITIAL_COMMISSION）

| プラン | 金額 |
|---|---:|
| `trial-6` | ¥500 |
| `sub-6` | ¥500 |
| `sub-12` | ¥1,000 |
| `subscription-monthly-12` (legacy) | ¥1,000 |

### 継続コミッション（RECURRING_COMMISSION）

| プラン | 金額/月 |
|---|---:|
| `sub-6` | ¥200 |
| `sub-12` | ¥300 |
| `subscription-monthly-12` (legacy) | ¥300 |

> `trial-6` には継続コミッションなし（一回購入のため）

---

## Section 5: 配送スケジュール

- 全プラン**月1回配送**
- 初回配送日: 購入時にユーザーが「**購入日から4営業日後 〜 + 1週間以内**」のカレンダーから選択
  - 営業日 = 土日・祝日を除いた平日（`lib/business-days.ts` の `getDeliveryDateRange()` で算出）
  - サブスク選択時のみ入力必須
- 2回目以降: 初回配送日を起点に1ヶ月サイクルで自動生成（`lib/subscription-schedule.ts` + `lib/delivery-prediction.ts`）
- 管理画面: `/admin/calendar` で日別配送をカレンダー表示、ヤマト運輸向けCSV出力可

---

## Section 6: 設計メモ（Phase1/Phase2 廃止について）

- 旧体系では `subscription-monthly-12` に Stripe Subscription Schedule で Phase1（初回30%OFF・送料無料）→ Phase2（2ヶ月目〜15%OFF・送料¥1,500）の自動移行を組んでいた
- 新体系（sub-6/sub-12）では**段階割引を完全撤廃**し、月額一律価格 + 単一フェーズ Subscription
- 新規購入時に `subscriptionSchedules.create({from_subscription})` を呼ぶロジックは Webhook から削除済み（`app/api/webhook/stripe/route.ts`）
- 既存 `subscription-monthly-12` 契約者の Stripe Subscription Schedule は無干渉で残置（Phase2 移行が引き続き動作）

---

## Section 7: 関連ファイル一覧

| ファイル | 役割 |
|---|---|
| `lib/subscription-schedule.ts` | プラン定義 `PLAN_CONFIGS` + 配送スケジュール計算 |
| `lib/business-days.ts` | 営業日判定 + 配送可能日範囲算出 |
| `lib/delivery-prediction.ts` | 未来6ヶ月分の配送予測 |
| `components/purchase/PurchaseFlow.tsx` | 購入フロー UI（プラン選択・配送日選択・決済） |
| `components/sections/SubscriptionSection.tsx` | トップページ定期プランカード |
| `components/sections/TrialSection.tsx` | トップページお試しプランバナー |
| `app/api/payment/create-intent/route.ts` | PaymentIntent/SetupIntent 作成 |
| `app/api/payment/activate-subscription/route.ts` | SetupIntent成功後のSubscription開始 |
| `app/api/webhook/stripe/route.ts` | Stripeイベント受信・コミッション計算・在庫減算 |
| `app/api/checkout/route.ts` | trial-6 専用 Hosted Checkout（実質未使用・残置） |
| `app/admin/calendar/` | 配送カレンダー管理画面 |
| `.env.example` | 環境変数テンプレート |
