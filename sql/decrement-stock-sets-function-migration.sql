-- F47-C: 在庫減算をアトミックに行うための RPC 関数
--
-- 旧実装は webhook 側で
--   SELECT stock_sets → 計算（newStock = currentStock - N） → UPDATE stock_sets = newStock
-- の3ステップで処理しており、同時実行（並列 Stripe Webhook）で競合する可能性がある。
--
-- 本関数は単一の UPDATE 文で `stock_sets = stock_sets - n` を行い、
-- WHERE 句で `stock_sets >= n` を確認して在庫不足時は更新しない。
-- 0 行未満には絶対に下がらず、競合時もどちらかの呼び出しが必ず勝つ。
--
-- 戻り値:
--   - 在庫減算成功: 減算後の stock_sets（INT）
--   - 在庫不足で減算できなかった場合: NULL
--
-- 呼び出し例（Supabase JS SDK）:
--   const { data, error } = await supabase.rpc('decrement_stock_sets', { p_set_type: '6-set', p_n: 2 });
--   if (data === null) { /* 在庫不足 */ }

CREATE OR REPLACE FUNCTION public.decrement_stock_sets(
  p_set_type TEXT,
  p_n INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_stock INT;
BEGIN
  -- N 件減算を試みる。stock_sets >= N の行のみ更新対象とする。
  UPDATE public.inventory_settings
     SET stock_sets = stock_sets - p_n,
         updated_at = NOW()
   WHERE set_type = p_set_type
     AND stock_sets >= p_n
  RETURNING stock_sets INTO v_new_stock;

  -- v_new_stock が NULL の場合は在庫不足（or 該当行なし）
  RETURN v_new_stock;
END;
$$;

-- service_role からのみ呼び出し可能にする（webhook はサーバ側）
REVOKE ALL ON FUNCTION public.decrement_stock_sets(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrement_stock_sets(TEXT, INT) TO service_role;
