# Phase 4: リグレッションテストシナリオ

## 概要

FBや変更後に再発防止として追加されたリグレッションシナリオを管理する。

---

## SC-REG-001 〜 SC-REG-005

（将来のFB対応で追加予定）

---

## SC-REG-006: レガシーコード一括削除後の残存機能確認

- **対象コミット**: 383abb8, 7542db2, b0dbde6
- **変更概要**: 未参照UIコンポーネント7種・未使用APIルート4つ・ユーティリティ/hook削除
- **テストファイル**: `e2e/tests/smoke-regression-legacy-cleanup.spec.ts`

### シナリオ一覧

| シナリオID | テスト名 | 種別 | 確認内容 |
|-----------|---------|------|---------|
| SC-REG-006-01 | トップページが正常に表示される | スモーク | ページタイトルとbody可視確認 |
| SC-REG-006-02 | SubscriptionSection が表示される | スモーク | 削除されたUIと独立して表示継続 |
| SC-REG-006-03 | メニューアイテムが1件以上表示される | スモーク | HeroSection.backup削除後もメニュー表示正常 |
| SC-REG-006-04 | メニュー一覧ページが正常に表示される | スモーク | /menu-list ページ HTTP 200 |
| SC-REG-006-05 | 管理画面ログインページが正常に表示される | スモーク | /admin/login HTTP 200 |
| SC-REG-006-06 | ログインフォームが表示される | スモーク | email/password入力欄の存在確認 |
| SC-REG-006-07 | /api/menu が正常に応答し配列を返す | スモーク | 残存APIルートの正常動作確認 |
| SC-REG-006-08 | POST /api/purchase が404を返す | リグレッション | 削除済みAPIルートが404であることを確認 |
| SC-REG-006-09 | GET /api/messages/[slug] が404を返す | リグレッション | 削除済みAPIルートが404であることを確認 |
| SC-REG-006-10 | GET /api/menu/[id] が404を返す | リグレッション | 削除済みAPIルートが404であることを確認 |

### 削除確認済みAPIルート
- `POST /api/purchase` → 404
- `GET /api/messages/[slug]` → 404
- `GET /api/menu/[id]` → 404
- `PATCH /api/admin/subscriptions/deliveries` → （テスト省略: 認証必須のため別途確認）

### 削除確認済みUIコンポーネント（現役画面への影響なし）
- HeroSection.backup.tsx
- AboutSection.tsx
- ProblemsSection.tsx
- TrialSection.tsx
- StatsSection/（6ファイル）
- IndividualMessageForm.tsx
- MobileFooterNav.tsx

---

---

## SC-F4: 配送希望日バリデーション撤廃 & 配送カレンダー配置変更

- **対象コミット**: ed2b090 (F4-1), 09494d6 (F4-2)
- **変更概要**:
  - F4-1: 配送希望日プルダウンを土日含む連続日付に変更、土日エラーバリデーション撤廃
  - F4-2: 管理画面の配送カレンダーで注文配置基準を「配送作業日」に変更
- **テストファイル**: `e2e/tests/smoke-f4-delivery-date.spec.ts`

### シナリオ一覧

| シナリオID | テスト名 | 種別 | 確認内容 |
|-----------|---------|------|---------|
| SC-F4-001-01 | 購入ページが正常に表示される | スモーク | /purchase が表示されることを確認 |
| SC-F4-002-01 | 配送希望日プルダウンが存在する | スモーク | ?step=info&plan=sub-6 で select[name="preferredDeliveryDate"] が可視 |
| SC-F4-002-02 | 案内文言「土日もご指定いただけます」が存在する | スモーク | F4-1 で追加された文言の表示確認 |
| SC-F4-002-03 | プルダウンの選択肢に土曜日（土）が含まれる | スモーク | 土曜日がプルダウンに含まれること（旧バリデーション撤廃の確認） |
| SC-F4-002-04 | プルダウンの選択肢に日曜日（日）が含まれる | スモーク | 日曜日がプルダウンに含まれること（旧バリデーション撤廃の確認） |
| SC-F4-003-01 | /admin/delivery が404にならない | スモーク | F4-2 のAPIルート変更後もカレンダーAPIが生存していることを確認 |
| SC-F4-003-02 | /admin/login が正常に表示される | スモーク | 認証フロー前提の管理画面アクセス確認 |

### 補足

- SC-F4-002 は `?step=info&plan=sub-6` URLパラメータで info ステップに直接遷移（Stripe等の外部リクエストが networkidle を妨げるため `domcontentloaded` を使用）
- 管理画面の配送作業日ロジック（resolveDeliveryWorkDate）はユニットテストで担保（未ログイン時のE2E確認は認証の壁があるためスモークのみ）

---

---

## SC-F6: /share モバイル一括DL Web Share API 化

- **対象コミット**: 113c0e0
- **変更概要**:
  - iOS Safari「1ジェスチャー = 1ファイルDL」制約回避のため Web Share API 経路を追加
  - デスクトップ（Playwright）は shouldUseShareApi() が false → 既存 file-saver 経路が引き続き動く
  - モバイル/Web Share API 経路は実機テスト依存のため E2E スコープ外
- **テストファイル**: `e2e/tests/smoke-f6-share-download.spec.ts`

### シナリオ一覧

| シナリオID | テスト名 | 種別 | 確認内容 |
|-----------|---------|------|---------|
| SC-F6-001-01 | 実在slugで200が返りページが表示される | スモーク | /share/a-school が200で表示される |
| SC-F6-001-02 | 存在しないslugは404コンテンツが表示される | スモーク | notFound() 発火後に404テキストが描画される |
| SC-F6-002-01 | 全選択ボタンが表示される | スモーク | 写真ありslugで「全選択」ボタンが可視（写真なし時 skip）|
| SC-F6-002-02 | ダウンロードボタンが表示される | スモーク | 写真ありslugで「ダウンロード」ボタンが可視（写真なし時 skip）|
| SC-F6-002-03 | 全選択後にダウンロードボタンが選択枚数を表示する | スモーク | 全選択 → 「ダウンロード (N枚)」文言確認（写真なし時 skip）|

### 補足

- SC-F6-002 は `a-school` スラッグが share_links テーブルに存在するが写真なしのため、ローカル環境では全 skip になる
  - 写真付きのslugが用意された環境でのみ SC-F6-002 が実行される（テスト自体は正しく書かれている）
- shouldUseShareApi() の true/false 分岐はユニットテストで担保

---

## SC-REG-007: /message/[slug] 500エラー修正後のスモークテスト

- **対象コミット**: bfa8e89, b03938c
- **変更概要**: isomorphic-dompurify → sanitize-html 置換（DOMPurify.sanitize → sanitizeShareLinkBody）、isomorphic-dompurify 依存削除
- **テストファイル**: `e2e/tests/smoke-message-slug.spec.ts`

### シナリオ一覧

| シナリオID | テスト名 | 種別 | 確認内容 |
|-----------|---------|------|---------|
| SC-REG-007-01 | 実在slugでページが200を返しHTML本文が描画される | スモーク | /message/a-school が200・article.message-body が表示 |
| SC-REG-007-02 | h1タイトルが表示される | スモーク | h1が可視かつテキスト1文字以上 |
| SC-REG-007-03 | 存在しないslugは404ページが表示される | スモーク | notFound()発火後に404コンテンツが描画される |

---

## SC-REG-008: trial-6 + 定期専用クーポン(KOSHIGAYA)誤適用ガード

- **対象コミット**: 537dc49 / 502a484
- **FB番号**: 未付与（指示書 docs/debug-coupon-trial-leak.md 由来）
- **変更概要**: 商品制限クーポン（scope='product'）をお試しプラン(trial-6)に誤適用しないガードを汎用ガード関数として実装。安全側デフォルトとして planId の Product 解決不能時も valid:false に倒す。
- **テストファイル**: `e2e/tests/regression-coupon-trial-leak.spec.ts`

### シナリオ一覧

| シナリオID | テスト名 | 種別 | 確認内容 |
|-----------|---------|------|---------|
| SC-REG-008-01 | trial-6 + KOSHIGAYA → valid:false かつ discount 未付与 | リグレッション | POST /api/payment/validate-coupon で valid:false・appliedCoupon/discount/percentOff が未付与 |
| SC-REG-008-02 | trial-6 + 無効コード → valid:false かつ discount 未付与 | リグレッション | 存在しないコードで valid:false・discount 未付与を恒久固定 |
| SC-REG-008-03 | sub-6 + 無効コード → valid:false（過剰ブロックでない） | リグレッション | scope='product' ガードが sub-6 に過剰発火していないこと |

### 環境制約（重要）

- ローカル .env.local の STRIPE_SECRET_KEY は sk_test（テストモード）
- KOSHIGAYA は Stripe live の Promotion Code 想定のため、テストモードでは stripe.promotionCodes.list が空を返し `{ valid:false, error:'無効なクーポンコードです' }` になる
- これは "wrong plan" ガードパス（`error:'このクーポンは選択中のプランにはお使いいただけません'`）ではなく "無効コード" パスだが、実害（割引適用）はゼロ
- ライブ環境での KOSHIGAYA による "wrong plan" ガードパスの確認は **手動確認項目**

### 過剰ブロック回帰（ライブ環境手動確認項目）

テストモード環境には scope='all' の全体クーポンが存在しないため、sub-6 / sub-12 で valid:true になる経路を E2E 自動検証できない。実コード（app/api/payment/validate-coupon/route.ts）上 scope==='all' の場合に valid:true を返す経路が存在することを確認済み。ライブ環境での sub-6 / sub-12 + 全体クーポンの valid:true は Stripe ダッシュボードのテストモード全体クーポンで手動確認すること。

---

## SC-REG-009: trial-6 + 定期専用クーポン（subscription_only フラグ）ブラックリストガード

- **対象コミット**: cb935fd / 23e22a4
- **FB番号**: 未付与（指示書 docs/debug-coupon-trial-leak.md 由来・第2ラウンド）
- **変更概要**: 越谷クーポン(ze8rKt4d)が applies_to 未設定でガード不発火だった件の恒久対応。coupon.metadata `subscription_only:"true"` を持つクーポンを、お試し(one-time/trial-6)でのみ弾く blacklist ガードを実装。3経路（validate-coupon / create-intent one-time / フロント PurchaseFlow 表示）で拒否を統一。フラグ無しは通す（将来のお試し用クーポンを個別運用可）。判定不能（取得失敗/例外）は安全側で弾く。定期(sub-6/sub-12)は不変。
- **テストファイル**: `e2e/tests/regression-coupon-subscription-only.spec.ts`

### シナリオ一覧

| シナリオID | テスト名 | 種別 | 確認内容 |
|-----------|---------|------|---------|
| SC-REG-009-01 | trial-6 + subscription_only:true クーポン → valid:false・定期専用文言・割引ゼロ | リグレッション | 実ガード経路（route.ts L85-93）を通過し弾く |
| SC-REG-009-02 | trial-6 + フラグ無しクーポン → valid:true・割引付与 | リグレッション | 過剰ブロックなし（お試し用クーポンは通す） |
| SC-REG-009-03 | sub-6 + subscription_only:true クーポン → valid:true | リグレッション | 定期では弾かない（isOneTimePlan=planId==='trial-6'のみ） |
| SC-REG-009-04 | sub-12 + subscription_only:true クーポン → valid:true | リグレッション | 定期では弾かない |
| SC-REG-009-05 | trial-6 + 無効コード → valid:false・割引ゼロ | リグレッション | 恒久固定 |

### 環境制約・検証メモ

- ローカル STRIPE_SECRET_KEY は sk_test（テストモード）。本番 KOSHIGAYA(ze8rKt4d) はテストモードに存在しないため、テストモード専用クーポン E2ETESTSUBONLY001(metadata.subscription_only="true") / E2ETESTNOFLAG001(フラグ無し) を作成して実ガード経路を再現。テスト後にプロモーションコード非アクティブ化・クーポン削除でクリーンアップ済み（live データ操作なし）。
- SC-REG-008（第1ラウンドの applies_to ガード）とは別経路。今回の真因は「有効クーポンに applies_to が無く、割引が metadata(product_discount/free_shipping)＋amount_off のアプリ独自適用で出る」点。詳細は docs/debug-coupon-trial-leak.md 【第2ラウンド】参照。
- **ライブ環境の最終確認（手動）**: 本番 KOSHIGAYA(ze8rKt4d) に metadata `subscription_only:"true"` を付与した上で、お試しで割引が出ないこと／定期で従来どおり使えることを確認すること。コード配備＋フラグ付与の両方で漏れ停止。
