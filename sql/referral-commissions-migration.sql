-- 紹介コード継続コミッション管理テーブル
-- 初回コミッション（お試し/サブスク初回契約）と継続コミッション（サブスク月次更新）を記録
--
-- 手動でSupabaseダッシュボードのSQL Editorで実行してください

CREATE TABLE public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('order', 'subscription_initial', 'subscription_recurring')),
    source_id TEXT NOT NULL,            -- orders.id or subscriptions.id
    stripe_invoice_id TEXT,             -- Stripe Invoice ID（継続課金時）
    plan_id TEXT NOT NULL,
    commission_type TEXT NOT NULL CHECK (commission_type IN ('initial', 'recurring')),
    commission_amount INTEGER NOT NULL,
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referral_commissions_code ON public.referral_commissions(referral_code);
CREATE INDEX idx_referral_commissions_source ON public.referral_commissions(source_type, source_id);
CREATE INDEX idx_referral_commissions_created_at ON public.referral_commissions(created_at DESC);
-- 重複防止: 同一invoice_idで二重記録しない
CREATE UNIQUE INDEX idx_referral_commissions_invoice_unique
    ON public.referral_commissions(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can do anything on referral_commissions"
    ON public.referral_commissions FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
