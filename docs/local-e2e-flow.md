# ローカル E2E 実行フロー（.next キャッシュ腐り対策）

ローカルの Playwright スモーク（描画系・特に Tailwind の `hidden` / レスポンシブ display
ユーティリティを検証するもの）を実行する際の標準フローと、頻出する dev サーバ起因の
誤 fail への対処をまとめる。

## 標準フロー（定例）

E2E を回す前に、dev-mate が **クリーン再起動済みの状態**で E2E テストメートに渡す。

```bash
rm -rf .next && pnpm dev -p 3010
```

- ポートは `3010`（Playwright の baseURL が `:3010` 固定。docker 非対応環境では
  `docker compose` ではなく `pnpm dev -p 3010` を使う）。
- 起動後、以下の2点を確認してから E2E テストメートに渡す:
  1. `GET /` が 200。
  2. 動的注入した `<div class="hidden">` の computed `display` が `none`
     （= Tailwind utilities 層が healthy）。

## 既知の事象：.next ビルドキャッシュ腐り

長時間 dev サーバを起動したまま多数の HMR 再コンパイルを重ねると、`.next` の
ビルドキャッシュが腐り、**ソース無変更でも** E2E が誤 fail する。症状は2系統:

1. **Tailwind utilities 層 stale**
   素の `.hidden` やレスポンシブ display（`sm:hidden` 等）が効かず、
   computed `display` が `none` にならない。
   → 出し分け系の `toBeHidden` / `toBeVisible` が落ちる。

2. **vendor-chunk 不整合**
   blog 詳細などで 500。サーバエラーに
   `Cannot find module './vendor-chunks/@supabase+auth-js@x.y.z.js'`
   （`.next/server/webpack-runtime.js` → 各 page.js の require stack）。

いずれも `rm -rf .next` のクリーン再起動で回復する。F61–F66 / F67–F68 の2回で
発生し、毎回クリーン再起動で全 green に復帰した実績がある。

## 切り分け手順

E2E が fail したとき、まず「ソース起因か環境起因か」を切り分ける:

1. 当該変更の diff に CSS / `tailwind.config` / `postcss` の変更が含まれるか確認。
   含まれない場合、utilities 不発はソース起因ではない可能性が高い。
2. 動的注入した `<div class="hidden">` の computed `display` を確認。
   `none` でなければ utilities 層が stale（環境起因）。
3. blog 等の 500 はサーバ実エラー（HTML 埋め込みエラー or dev ログ）で
   vendor-chunk 不整合かを確認。
4. 環境起因と判断したら `rm -rf .next && pnpm dev -p 3010` でクリーン再起動し、
   上記ヘルスチェック（`/` 200・`.hidden` = none）を確認のうえ再実行する。

## 方針：製品 spec を環境揺らぎに合わせない

- `.hidden = none` 等の **ヘルスチェックを製品 E2E spec に埋め込まない**。
  本番由来でない dev 環境固有の事象を製品 spec に混ぜないため。
- 環境揺らぎはクリーン再起動で**根本回避**する。
- E2E テストメートが実行前にアドホックに `.hidden = none` を確認するのは可。
  ただし spec へはコミットしない。
- 「壊れたキャッシュ状態」に合わせて spec の期待値を書き換えない
  （誤った green を作らない）。クリーン後に通る状態が正しい仕様。

## dev hydration 遅延による CTA / クリック系 E2E の flaky 対処

SSR 化したセクション（FAQ・購入CTA・プランボタン等）は、HTML が即出る一方で
**操作可能になるのは hydration 完了後**。dev モードは unoptimized＋HMR で
hydration が誇張され（実測 約1.3秒）、SSR 前提でない旧テストが
「要素は見えるのにクリックが効かない」で flaky に落ちる。これは **実装バグではない**。

判定の目安（実害なしの裏付け）:
- ブラウザ console に "Hydration failed" / "Text content did not match" **警告 0 件**。
- 該当セクションの client fetch が 0 件（initial データで確定し再上書きしていない）。
- SSR と初期 state（開閉・表示）が一致、コンテンツの消失/差し替えなし。

対処（2段構え）:
1. **テスト側を hydration-aware に**：クリック→期待 state を
   `expect(...).toPass()` / web-first assertion でリトライ待ち（clickUntil / clickUntilUrl）。
   期待値・仕様は変えない（待機の入れ方だけ。緩めるのではない）。
2. **お金/重要導線（プラン種別が決済に渡る等）は本番ビルドで検証**：
   `rm -rf .next && pnpm build && pnpm start -p 3010` で deterministic green を確認する。
   dev の flaky は本番 hydration（サブ秒）で解消するため、本番ビルドが正しい検証環境。
   購入 CTA の遷移先（?plan=trial-6 / sub-6 / sub-12 等）は恒久 spec 化して回帰を防ぐ。

参考実績: F76（購入CTA 3D化）・SEO-S1（FAQ SSR化）で発生。いずれも実装健全で、
テスト待機調整＋本番ビルド検証で恒久 green 化した。
