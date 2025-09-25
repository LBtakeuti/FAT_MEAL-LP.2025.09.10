# Vercelデプロイガイド

## デプロイ手順

### ステップ1: Vercelにデプロイ

ターミナルで以下のコマンドを実行：

```bash
vercel
```

質問への回答：
1. **Set up and deploy?** → `Y` (Yes)
2. **Which scope?** → 自分のアカウントを選択
3. **Link to existing project?** → `N` (No - 新規プロジェクト)
4. **Project name?** → `futorumeshi-lp` (またはお好みの名前)
5. **Directory?** → `.` (現在のディレクトリ)
6. **Want to override settings?** → `N` (No)

### ステップ2: 環境変数の設定

デプロイ後、Vercelダッシュボードで環境変数を設定：

1. https://vercel.com/dashboard にアクセス
2. デプロイしたプロジェクトをクリック
3. 「Settings」タブをクリック
4. 左メニューの「Environment Variables」をクリック
5. 以下の環境変数を追加：

#### 必須の環境変数

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabaseダッシュボードから取得 | SupabaseのプロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabaseダッシュボードから取得 | Supabaseの公開キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabaseダッシュボードから取得 | Supabaseのサービスキー（秘密） |
| `JWT_SECRET` | ランダムな32文字の文字列を生成 | 認証用の秘密鍵 |
| `ADMIN_PASSWORD_HASH` | 現在の値をそのまま使用 | 管理者パスワードのハッシュ |

#### 本番環境用の設定

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `NEXT_PUBLIC_BASE_URL` | `https://あなたのドメイン.vercel.app` | デプロイ後のURL |
| `NODE_ENV` | `production` | 本番環境設定 |

### ステップ3: 再デプロイ

環境変数設定後、再デプロイが必要：

```bash
vercel --prod
```

または、Vercelダッシュボードから：
1. 「Deployments」タブ
2. 最新のデプロイの「...」メニュー
3. 「Redeploy」をクリック

## デプロイ後の確認

### アクセスURL

- **本番環境**: `https://プロジェクト名.vercel.app`
- **管理画面**: `https://プロジェクト名.vercel.app/admin`

### 確認事項

1. **フロントエンド**
   - メニューが表示されるか
   - 画像が正しく表示されるか
   - レスポンシブデザインが機能するか

2. **管理画面**
   - ログインできるか（パスワード: admin123）
   - メニューの作成・編集・削除ができるか
   - Supabaseにデータが保存されるか

## トラブルシューティング

### 環境変数が反映されない

1. Vercelダッシュボードで環境変数を確認
2. 「Redeploy」を実行
3. ブラウザのキャッシュをクリア

### 500エラーが出る

1. Vercelの「Functions」タブでログを確認
2. 環境変数が正しく設定されているか確認
3. Supabaseの接続情報を再確認

### 画像がアップロードできない

現在の実装では画像はローカルに保存されるため、Vercelでは永続化されません。
Supabase Storageへの移行が必要です（別途実装予定）。

## カスタムドメインの設定（オプション）

1. Vercelダッシュボードの「Domains」タブ
2. 「Add Domain」をクリック
3. ドメインを入力して指示に従う

## 次のステップ

1. **画像のSupabase Storage移行**
2. **認証システムの強化**
3. **本番用のセキュリティ設定**
4. **パフォーマンス最適化**