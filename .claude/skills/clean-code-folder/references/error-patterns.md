# エラーパターンリファレンス

## 型エラー

### パターン
```
TypeError: Cannot read property 'x' of undefined
TypeError: 'NoneType' object has no attribute 'x'
```

### 根本原因
- 未初期化変数へのアクセス
- APIレスポンスの型が期待と異なる
- オプショナルな値のチェック漏れ

### 防止策
```javascript
// ❌ Bad
const name = user.profile.name;

// ✅ Good
const name = user?.profile?.name ?? 'Unknown';
```

---

## Null/Undefined参照

### パターン
```
NullPointerException
Cannot read properties of null
AttributeError: 'NoneType' object
```

### 根本原因
- 配列・オブジェクトの空チェック漏れ
- 非同期処理の競合状態
- 初期化順序の問題

### 防止策
- Optional Chaining (`?.`)
- Nullish Coalescing (`??`)
- 早期リターンによるガード節

---

## インデックス範囲外

### パターン
```
IndexError: list index out of range
ArrayIndexOutOfBoundsException
```

### 根本原因
- 配列長チェック漏れ
- off-by-oneエラー（境界条件）
- 空配列へのアクセス

### 防止策
```python
# ❌ Bad
first_item = items[0]

# ✅ Good
first_item = items[0] if items else None
```

---

## 非同期処理エラー

### パターン
```
UnhandledPromiseRejection
Uncaught (in promise)
```

### 根本原因
- await忘れ
- try-catch漏れ
- Promise.all内の個別エラー未処理

### 防止策
```javascript
// ❌ Bad
fetchData();

// ✅ Good
try {
  await fetchData();
} catch (error) {
  handleError(error);
}
```

---

## 循環依存

### パターン
```
ImportError: cannot import name 'X' from partially initialized module
ReferenceError: Cannot access before initialization
```

### 根本原因
- モジュール間の相互参照
- 設計の責務分離不足

### 防止策
- 依存関係を一方向に整理
- インターフェース/抽象クラスで分離
- 遅延インポート

---

## メモリリーク

### パターン
- アプリケーションが徐々に遅くなる
- OutOfMemoryError

### 根本原因
- イベントリスナーの解除忘れ
- タイマーのクリア忘れ
- クロージャによる参照保持

### 防止策
- cleanup関数の実装
- WeakMapの活用
- 明示的なリソース解放

---

## エラー修正時の原則

1. **最小限の変更** - 問題箇所のみ修正
2. **根本原因対処** - 表面的な修正を避ける
3. **テスト追加** - 同エラーの再発を防止
4. **パターン記憶** - 類似コード生成時に防止策を適用
