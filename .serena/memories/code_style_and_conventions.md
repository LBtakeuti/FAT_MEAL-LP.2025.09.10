# コードスタイルとコーディング規約

## TypeScript
- **Strictモード**: 有効
- **ターゲット**: ES2017
- **モジュール**: ESNext
- **パスエイリアス**: `@/*` → プロジェクトルート

## ESLint設定
- `next/core-web-vitals`と`next/typescript`を継承
- `@typescript-eslint/no-explicit-any`: オフ（anyを許容）
- `@typescript-eslint/no-unused-vars`: 警告
- `react-hooks/exhaustive-deps`: 警告

## Tailwind CSS
- 標準的なブレークポイント使用
- カスタムカラー: `orange` パレット
- `safelist`でよく使うクラスを定義

## コンポーネント構成
- **命名**: PascalCase（例: `HeroSection.tsx`）
- **エクスポート**: デフォルトエクスポート推奨
- **スタイル**: Tailwind CSSクラスを使用

## API Routes
- App Router形式（`route.ts`）
- HTTP メソッドごとに関数をエクスポート（GET, POST, PUT, DELETE）

## ディレクトリ構成
- `app/`: ページとAPIルート
- `components/`: 再利用可能なUIコンポーネント
- `lib/`: ユーティリティ関数
- `data/`: 静的データ

## 命名規則
- **ファイル**: kebab-case または PascalCase（コンポーネント）
- **変数・関数**: camelCase
- **型・インターフェース**: PascalCase
- **定数**: UPPER_SNAKE_CASE または camelCase
