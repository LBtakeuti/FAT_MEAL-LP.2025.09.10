-- ==========================================
-- サブスクリプション機能用テーブル作成スクリプト
-- ==========================================
-- 月額自動更新プランの管理用テーブル
-- 
-- プラン構成:
-- - subscription-monthly-12: 月12食（月1回配送）¥9,780/月
-- - subscription-monthly-24: 月24食（月2回配送）¥18,600/月
-- - subscription-monthly-48: 月48食（月4回配送）¥34,800/月

-- ==========================================
-- 1. サブスクリプションテーブル
-- ==========================================

-- 既存のテーブルを削除（存在する場合）
DROP TABLE IF EXISTS public.subscription_cancellation_requests CASCADE;
DROP TABLE IF EXISTS public.subscription_deliveries CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- サブスクリプションテーブルを作成
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- 決済情報（Stripe Subscription）
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    stripe_price_id TEXT NOT NULL,
    
    -- プラン情報
    plan_id TEXT NOT NULL, -- 'subscription-monthly-12', 'subscription-monthly-24', 'subscription-monthly-48'
    plan_name TEXT NOT NULL, -- 'ふとるめし12食 月額プラン'
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    -- 配送内容設定
    meals_per_delivery INTEGER NOT NULL DEFAULT 12,
    deliveries_per_month INTEGER NOT NULL CHECK (deliveries_per_month IN (1, 2, 4)),
    
    -- 料金情報
    monthly_product_price INTEGER NOT NULL, -- 商品代金（月額）
    monthly_shipping_fee INTEGER NOT NULL, -- 送料（月額）
    monthly_total_amount INTEGER NOT NULL, -- 月額合計金額
    
    -- 配送管理
    next_delivery_date DATE,
    last_delivery_date DATE,
    preferred_delivery_date DATE, -- 初回配送希望日
    
    -- 支払い情報
    payment_status TEXT NOT NULL DEFAULT 'active' CHECK (payment_status IN ('active', 'past_due', 'canceled', 'unpaid')),
    
    -- 配送先情報（JSONB）
    shipping_address JSONB NOT NULL,
    -- {
    --   "name": "山田太郎",
    --   "email": "yamada@example.com",
    --   "phone": "090-1234-5678",
    --   "postal_code": "123-4567",
    --   "prefecture": "東京都",
    --   "city": "渋谷区",
    --   "address_detail": "1-2-3",
    --   "building": "マンション101"
    -- }
    
    -- ステータス
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'past_due')),
    
    -- 期間管理
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    canceled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_payment_status ON public.subscriptions(payment_status);
CREATE INDEX idx_subscriptions_next_delivery_date ON public.subscriptions(next_delivery_date);
CREATE INDEX idx_subscriptions_started_at ON public.subscriptions(started_at DESC);

-- コメント
COMMENT ON TABLE public.subscriptions IS 'サブスクリプション情報（月額自動更新プラン）';
COMMENT ON COLUMN public.subscriptions.id IS 'UUID（主キー）';
COMMENT ON COLUMN public.subscriptions.user_id IS 'ユーザーID（auth.users.idと連携）';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe Subscription ID';
COMMENT ON COLUMN public.subscriptions.stripe_customer_id IS 'Stripe Customer ID';
COMMENT ON COLUMN public.subscriptions.stripe_price_id IS 'Stripe Price ID';
COMMENT ON COLUMN public.subscriptions.plan_id IS 'プランID（subscription-monthly-12等）';
COMMENT ON COLUMN public.subscriptions.plan_name IS 'プラン名';
COMMENT ON COLUMN public.subscriptions.meals_per_delivery IS '1回の配送あたりの食数（12食固定）';
COMMENT ON COLUMN public.subscriptions.deliveries_per_month IS '月あたりの配送回数（1, 2, 4）';
COMMENT ON COLUMN public.subscriptions.monthly_product_price IS '商品代金（月額）';
COMMENT ON COLUMN public.subscriptions.monthly_shipping_fee IS '送料（月額）';
COMMENT ON COLUMN public.subscriptions.monthly_total_amount IS '月額合計金額';
COMMENT ON COLUMN public.subscriptions.next_delivery_date IS '次回配送予定日';
COMMENT ON COLUMN public.subscriptions.preferred_delivery_date IS '初回配送希望日';
COMMENT ON COLUMN public.subscriptions.shipping_address IS '配送先情報（JSONB）';
COMMENT ON COLUMN public.subscriptions.status IS 'ステータス（active/paused/canceled/past_due）';
COMMENT ON COLUMN public.subscriptions.payment_status IS '支払いステータス';
COMMENT ON COLUMN public.subscriptions.started_at IS '契約開始日時';
COMMENT ON COLUMN public.subscriptions.current_period_start IS '現在の課金期間開始日';
COMMENT ON COLUMN public.subscriptions.current_period_end IS '現在の課金期間終了日';
COMMENT ON COLUMN public.subscriptions.canceled_at IS '解約日時';

-- ==========================================
-- 2. サブスクリプション配送予定テーブル
-- ==========================================

CREATE TABLE public.subscription_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    
    -- 配送予定日と実配送日
    scheduled_date DATE NOT NULL,
    delivered_date DATE,
    
    -- ステータス
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
    
    -- 配送内容
    menu_set TEXT NOT NULL,
    meals_per_delivery INTEGER NOT NULL DEFAULT 12,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    
    -- 決済との紐付け
    stripe_invoice_id TEXT,
    
    -- 注文との紐付け（配送確定時にordersテーブルに作成される）
    order_id UUID,
    order_number BIGINT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_subscription_deliveries_subscription_id ON public.subscription_deliveries(subscription_id);
CREATE INDEX idx_subscription_deliveries_scheduled_date ON public.subscription_deliveries(scheduled_date);
CREATE INDEX idx_subscription_deliveries_status ON public.subscription_deliveries(status);
CREATE INDEX idx_subscription_deliveries_stripe_invoice_id ON public.subscription_deliveries(stripe_invoice_id);

-- コメント
COMMENT ON TABLE public.subscription_deliveries IS 'サブスクリプション配送予定';
COMMENT ON COLUMN public.subscription_deliveries.id IS 'UUID（主キー）';
COMMENT ON COLUMN public.subscription_deliveries.subscription_id IS 'サブスクリプションID';
COMMENT ON COLUMN public.subscription_deliveries.scheduled_date IS '配送予定日';
COMMENT ON COLUMN public.subscription_deliveries.delivered_date IS '実際の配送日';
COMMENT ON COLUMN public.subscription_deliveries.status IS 'ステータス（pending/shipped/delivered/cancelled）';
COMMENT ON COLUMN public.subscription_deliveries.menu_set IS '配送内容（例: ふとるめし12食セット）';
COMMENT ON COLUMN public.subscription_deliveries.meals_per_delivery IS '配送食数（12固定）';
COMMENT ON COLUMN public.subscription_deliveries.stripe_invoice_id IS 'Stripe Invoice ID';
COMMENT ON COLUMN public.subscription_deliveries.order_id IS '注文ID（配送確定時に設定）';
COMMENT ON COLUMN public.subscription_deliveries.order_number IS '注文番号（配送確定時に設定）';

-- ==========================================
-- 3. 解約申し出テーブル
-- ==========================================

CREATE TABLE public.subscription_cancellation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- 顧客情報
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    
    -- 解約理由
    reason TEXT,
    message TEXT,
    
    -- ステータス
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    
    -- Stripe情報
    stripe_subscription_id TEXT,
    
    -- 処理日時
    cancelled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_cancellation_requests_subscription_id ON public.subscription_cancellation_requests(subscription_id);
CREATE INDEX idx_cancellation_requests_status ON public.subscription_cancellation_requests(status);
CREATE INDEX idx_cancellation_requests_created_at ON public.subscription_cancellation_requests(created_at DESC);

-- コメント
COMMENT ON TABLE public.subscription_cancellation_requests IS 'サブスクリプション解約申し出';
COMMENT ON COLUMN public.subscription_cancellation_requests.id IS 'UUID（主キー）';
COMMENT ON COLUMN public.subscription_cancellation_requests.subscription_id IS 'サブスクリプションID';
COMMENT ON COLUMN public.subscription_cancellation_requests.user_id IS 'ユーザーID';
COMMENT ON COLUMN public.subscription_cancellation_requests.reason IS '解約理由';
COMMENT ON COLUMN public.subscription_cancellation_requests.message IS '自由記述メッセージ';
COMMENT ON COLUMN public.subscription_cancellation_requests.status IS 'ステータス（pending/processing/completed/cancelled）';
COMMENT ON COLUMN public.subscription_cancellation_requests.cancelled_at IS '解約処理完了日時';

-- ==========================================
-- 4. ordersテーブルにuser_id列を追加
-- ==========================================

-- user_id列を追加（存在しない場合）
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

COMMENT ON COLUMN public.orders.user_id IS 'ユーザーID（会員の場合）';

-- ==========================================
-- 5. Row Level Security (RLS) 設定
-- ==========================================

-- RLSを有効化
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_cancellation_requests ENABLE ROW LEVEL SECURITY;

-- サブスクリプションのRLSポリシー
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can do anything on subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can do anything on subscriptions"
    ON public.subscriptions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 配送予定のRLSポリシー
DROP POLICY IF EXISTS "Users can view their own subscription deliveries" ON public.subscription_deliveries;
DROP POLICY IF EXISTS "Service role can do anything on subscription_deliveries" ON public.subscription_deliveries;

CREATE POLICY "Users can view their own subscription deliveries"
    ON public.subscription_deliveries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions
            WHERE subscriptions.id = subscription_deliveries.subscription_id
            AND subscriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can do anything on subscription_deliveries"
    ON public.subscription_deliveries
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- 解約申し出のRLSポリシー
CREATE POLICY "Users can view their own cancellation requests"
    ON public.subscription_cancellation_requests
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cancellation requests"
    ON public.subscription_cancellation_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can do anything on cancellation_requests"
    ON public.subscription_cancellation_requests
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ==========================================
-- 6. 更新日時の自動更新トリガー
-- ==========================================

-- update_updated_at_column関数が存在しない場合は作成
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを設定（存在する場合は削除してから作成）
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_deliveries_updated_at ON public.subscription_deliveries;
CREATE TRIGGER update_subscription_deliveries_updated_at
    BEFORE UPDATE ON public.subscription_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cancellation_requests_updated_at ON public.subscription_cancellation_requests;
CREATE TRIGGER update_cancellation_requests_updated_at
    BEFORE UPDATE ON public.subscription_cancellation_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- スクリプト完了
-- ==========================================
-- 
-- 実行後の確認:
-- SELECT * FROM public.subscriptions LIMIT 5;
-- SELECT * FROM public.subscription_deliveries LIMIT 5;
-- SELECT * FROM public.subscription_cancellation_requests LIMIT 5;
