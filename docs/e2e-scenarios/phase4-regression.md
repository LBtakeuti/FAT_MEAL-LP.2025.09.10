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
