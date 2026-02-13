# API Structure

## Public Endpoints（認証不要、キャッシュ有効）

- `/api/ambassadors` - アクティブなアンバサダー取得
- `/api/feedbacks` - アクティブなフィードバック取得
- `/api/news` - ニュース一覧取得
- `/api/menu` - メニュー一覧取得

## Admin Endpoints（認証必須、CRUD操作）

- `/api/admin/ambassadors` - アンバサダー管理
- `/api/admin/feedbacks` - フィードバック管理
- `/api/admin/news` - ニュース管理
- `/api/admin/menu` - メニュー管理

すべての管理者エンドポイントはセッションCookieによる認証が必要です。
