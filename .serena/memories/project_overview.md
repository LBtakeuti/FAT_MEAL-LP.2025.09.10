# Futorumeshi LP - プロジェクト概要

## プロジェクトの目的
「ふとるメシ」のランディングページ（LP）およびWebアプリケーション。お弁当メニューの紹介、購入フロー、お問い合わせ、管理画面機能を提供する。

## 技術スタック
- **フレームワーク**: Next.js 15.5.2 (App Router)
- **言語**: TypeScript (strict mode)
- **UI**: React 19.1.0
- **スタイリング**: Tailwind CSS 3.4.17
- **データベース**: Supabase
- **認証**: JWT (jsonwebtoken) + bcryptjs
- **スライダー**: Swiper 11.2.10
- **Cookie管理**: cookies-next
- **デプロイ**: Vercel

## ディレクトリ構成
```
├── app/                    # Next.js App Router
│   ├── page.tsx           # トップページ
│   ├── layout.tsx         # ルートレイアウト
│   ├── globals.css        # グローバルスタイル
│   ├── admin/             # 管理画面
│   │   ├── contacts/      # お問い合わせ管理
│   │   ├── news/          # お知らせ管理
│   │   ├── menu/          # メニュー管理
│   │   ├── inventory/     # 在庫管理
│   │   └── login/         # ログイン
│   ├── api/               # API Routes
│   │   ├── admin/         # 管理用API
│   │   ├── contact/       # お問い合わせAPI
│   │   ├── menu/          # メニューAPI
│   │   └── purchase/      # 購入API
│   ├── contact/           # お問い合わせページ
│   ├── menu/              # メニュー詳細
│   ├── menu-list/         # メニュー一覧
│   ├── news/              # お知らせ
│   ├── purchase/          # 購入ページ
│   ├── privacy/           # プライバシーポリシー
│   ├── terms/             # 利用規約
│   └── legal/             # 特定商取引法に基づく表記
├── components/            # UIコンポーネント
│   ├── HeroSection.tsx    # ヒーローセクション
│   ├── MenuSection.tsx    # メニューセクション
│   ├── Header.tsx         # ヘッダー
│   ├── Footer.tsx         # フッター
│   └── ...
├── lib/                   # ユーティリティ
│   ├── supabase.ts        # Supabaseクライアント
│   ├── db.ts              # DB操作
│   ├── db-adapter.ts      # DBアダプター
│   └── auth.ts            # 認証
├── data/                  # 静的データ
│   ├── menuData.ts        # メニューデータ
│   └── newsData.ts        # お知らせデータ
└── public/                # 静的ファイル
```

## 環境変数
`.env.local`で管理（`.gitignore`に含まれる）
- Supabase接続情報
- JWT秘密鍵
- 管理者認証情報

## カスタムカラー
- **メインカラー**: オレンジ系 (`orange-500`: #f97316)
- CSS変数: `--background`, `--foreground`
