# コーディング原則リファレンス

## SOLID原則

### S - 単一責務（Single Responsibility）
```
❌ Bad: UserManagerクラスが認証、メール送信、DB操作を担当
✅ Good: AuthService, EmailService, UserRepositoryに分離
```

### O - 開放閉鎖（Open/Closed）
拡張に開き、修正に閉じる。継承やインターフェースで拡張可能に。

### L - リスコフ置換（Liskov Substitution）
子クラスは親クラスと置換可能でなければならない。

### I - インターフェース分離（Interface Segregation）
大きなインターフェースより、小さく特化したインターフェースを。

### D - 依存性逆転（Dependency Inversion）
具象ではなく抽象に依存する。DIコンテナの活用。

## DRY（Don't Repeat Yourself）

重複コードは関数・クラス・モジュールに抽出：
```
❌ Bad: 同じバリデーションロジックが3箇所に
✅ Good: validateEmail()関数に抽出
```

## セキュリティチェックリスト

| カテゴリ | チェック項目 |
|---------|-------------|
| 入力検証 | すべての外部入力をサニタイズ |
| 認証 | パスワードハッシュ化（bcrypt/argon2） |
| 認可 | 最小権限、ロールベースアクセス制御 |
| データ | 機密情報は環境変数、暗号化保存 |
| SQL | プリペアドステートメント使用 |
| XSS | 出力エスケープ、CSP設定 |
| CSRF | トークン検証 |

## パフォーマンス最適化

### データベース
- インデックス適切に設定
- N+1クエリ回避（JOIN、eager loading）
- 必要なカラムのみSELECT

### アルゴリズム
- 適切なデータ構造選択（検索 → Set/Map）
- キャッシュ活用（メモ化、Redis）
- 遅延評価・ストリーム処理

### メモリ
- 大きなオブジェクトの早期解放
- ストリーム処理で大ファイル対応
- 循環参照に注意

## 言語別スタイルガイド

| 言語 | 公式スタイルガイド |
|------|-------------------|
| Python | PEP 8 |
| JavaScript | Airbnb / Google |
| TypeScript | TSLint / ESLint |
| Go | gofmt |
| Rust | rustfmt |
| Java | Google Java Style |
| C# | .NET Coding Conventions |
