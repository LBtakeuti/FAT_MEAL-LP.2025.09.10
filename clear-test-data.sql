-- ==========================================
-- 本番デプロイ前のテストデータクリア
-- ==========================================
-- 実行前に必ずバックアップを取ってください
-- Supabaseダッシュボードの SQL Editor で実行してください

-- 注意: このスクリプトは以下のデータを削除します
-- - 注文履歴 (orders)
-- - サブスクリプション配送予定 (subscription_deliveries)
-- - サブスクリプション履歴 (subscriptions)
-- - 解約リクエスト (subscription_cancellation_requests)
-- - お問い合わせ履歴 (contacts)

-- ==========================================
-- 1. サブスクリプション配送予定を削除（外部キー制約のため先に削除）
-- ==========================================
DELETE FROM public.subscription_deliveries;

-- ==========================================
-- 2. 解約リクエストを削除
-- ==========================================
DELETE FROM public.subscription_cancellation_requests;

-- ==========================================
-- 3. サブスクリプション履歴を削除
-- ==========================================
DELETE FROM public.subscriptions;

-- ==========================================
-- 4. 注文履歴を削除
-- ==========================================
DELETE FROM public.orders;

-- ==========================================
-- 5. お問い合わせ履歴を削除
-- ==========================================
DELETE FROM public.contacts;

-- ==========================================
-- 確認用クエリ
-- ==========================================
-- 各テーブルの件数を確認
SELECT 'orders' as table_name, COUNT(*) as count FROM public.orders
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM public.subscriptions
UNION ALL
SELECT 'subscription_deliveries', COUNT(*) FROM public.subscription_deliveries
UNION ALL
SELECT 'subscription_cancellation_requests', COUNT(*) FROM public.subscription_cancellation_requests
UNION ALL
SELECT 'contacts', COUNT(*) FROM public.contacts;

-- ==========================================
-- 完了メッセージ
-- ==========================================
-- すべてのテストデータが削除されました
-- 本番環境へのデプロイを続行してください
