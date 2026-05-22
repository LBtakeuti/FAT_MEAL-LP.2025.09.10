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
