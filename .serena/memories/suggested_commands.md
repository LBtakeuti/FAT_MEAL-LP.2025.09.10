# 開発コマンド一覧

## 開発サーバー
```bash
npm run dev
```
http://localhost:3000 でアクセス

## ビルド
```bash
npm run build
```

## 本番起動
```bash
npm run start
```

## リント
```bash
npm run lint
```

## パッケージインストール
```bash
npm install
```

## Git操作（macOS/Darwin）
```bash
git status           # 状態確認
git add .            # 全ファイルステージング
git commit -m "msg"  # コミット
git push             # プッシュ
git pull             # プル
```

## ファイル操作（macOS/Darwin）
```bash
ls -la               # ファイル一覧（詳細）
cd <dir>             # ディレクトリ移動
find . -name "*.ts"  # ファイル検索
grep -r "pattern" .  # テキスト検索
```

## Vercelデプロイ
- GitHubにプッシュすると自動デプロイ
- または `vercel` CLIを使用
