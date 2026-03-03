---
name: daily-task-log
description: ふとるめしLP（FAT_MEAL）プロジェクトの1日の対応タスクログをMarkdownファイルとして自動生成するスキル。「日次ログ」「日報」「今日のタスクまとめ」「ログ作成」「今日の作業記録」「対応タスク作成」「タスクファイル作成」のようなリクエストで積極的に使用する。スキルが呼び出されたらすぐにgitコミットを解析してログを作成する。ユーザーが確認なしにすぐ作成してほしいと言った場合も使用する。
---

# ふとるめしLP 日次タスクログ生成スキル

1日の終わりに呼び出し、その日の作業をMarkdownファイルとしてまとめる。
**スキルが起動したらすぐに実行する。確認は不要。**

## プロジェクト情報

- **リポジトリ:** `/Users/keitakeuchi/FTA＿MEAL/futorumeshi-lp/FAT_MEAL-LP.2025.09.10`
- **ログ保存先:** `/Users/keitakeuchi/FTA＿MEAL/futorumeshi-lp/FAT_MEAL-LP.2025.09.10/日次タスク/`
- **デスクトップ保存先:** `/Users/keitakeuchi/Desktop/ふとるめしデイリータスク/`

## 実行ステップ

### Step 1: 今日の日付を取得
```bash
date "+%Y-%m-%d"
```
ファイル名に使う（例: `2026-03-03.md`）。

### Step 2: 出力先ディレクトリを確認・作成
```bash
mkdir -p "/Users/keitakeuchi/FTA＿MEAL/futorumeshi-lp/FAT_MEAL-LP.2025.09.10/日次タスク"
mkdir -p "/Users/keitakeuchi/Desktop/ふとるめしデイリータスク"
```

ファイルが既に存在する場合はユーザーに確認する。

### Step 3: 今日のコミット一覧を取得
```bash
TZ=Asia/Tokyo git -C /Users/keitakeuchi/FTA＿MEAL/futorumeshi-lp/FAT_MEAL-LP.2025.09.10 log \
  --since="$(TZ=Asia/Tokyo date +%Y-%m-%d) 00:00:00" \
  --format="%H %aI %s" \
  --reverse
```
コミットが0件の場合はその旨を伝えて終了する。

### Step 4: 各コミットの内容を解析
各コミットハッシュに対して:
```bash
git -C /Users/keitakeuchi/FTA＿MEAL/futorumeshi-lp/FAT_MEAL-LP.2025.09.10 show <hash> --stat --format="%s%n%b"
```
内容を読んで、何の問題をどう解決したか把握する。

### Step 5: Markdownを生成して保存
下記フォーマットでファイルを作成する。
保存先: `/Users/keitakeuchi/FTA＿MEAL/futorumeshi-lp/FAT_MEAL-LP.2025.09.10/日次タスク/YYYY-MM-DD.md`

### Step 6: デスクトップにもコピーを保存
```bash
cp "/Users/keitakeuchi/FTA＿MEAL/futorumeshi-lp/FAT_MEAL-LP.2025.09.10/日次タスク/YYYY-MM-DD.md" \
   "/Users/keitakeuchi/Desktop/ふとるめしデイリータスク/YYYY-MM-DD.md"
```

完了後、以下の2つのパスをユーザーに伝える:
- プロジェクト内: `/Users/keitakeuchi/FTA＿MEAL/futorumeshi-lp/FAT_MEAL-LP.2025.09.10/日次タスク/YYYY-MM-DD.md`
- デスクトップ: `/Users/keitakeuchi/Desktop/ふとるめしデイリータスク/YYYY-MM-DD.md`

---

## 出力フォーマット

このログは「社内タスク共有用の作業報告書」として使う。**コードや技術的な用語は一切書かない**。システム開発の知識がない人が読んでも理解できるように書くこと。コミットIDは一切含めない。

```markdown
# 作業ログ — YYYY年M月D日

## この日の作業概要

[2〜3文で、この日に何をやったかを非エンジニア向けにまとめる。]

---

## 対応詳細

### 1. [依頼者が分かるテーマ名。例:「購入ページの価格表示を修正」]

**状況:**
[何が起きていたか。「〜が表示されなかった」「〜ができない状態だった」のように書く]

**対応内容:**
[何をしたか。「〜の設定を修正した」「〜の機能を追加した」など。ファイル名・コマンドは書かない]

---
```

## フォーマット規則

- **コードは書かない**: ファイル名、コマンド、ID等は不要
- **コミットIDは書かない**: 依頼者には不要
- **主語は「私」**: 「〜を修正した」「〜を追加した」など
- **グループ化**: 同じテーマのコミットは1つのセクションにまとめる
- **番号付け**: 対応詳細のセクションは `### 1.` `### 2.` のように番号を付ける
- **セパレーター**: 各セクションの末尾に `---` を入れる
- **言語**: 全て日本語
