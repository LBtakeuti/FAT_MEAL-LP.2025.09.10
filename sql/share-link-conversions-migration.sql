-- share-link経由の購入コンバージョン記録テーブル
-- /share/[slug] 経由で着地したユーザーの購入を、share_link_id と紐付けて記録する。
-- 集計は「件数だけ」だが、source_type で one-time / subscription_initial / recurring を
-- 区別できるよう保持しておく（人カウントは order + subscription_initial の和を使う）。

CREATE TABLE public.share_link_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('order', 'subscription_initial', 'subscription_recurring')),
  source_id TEXT NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  plan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slc_link ON public.share_link_conversions(share_link_id);
CREATE INDEX idx_slc_source ON public.share_link_conversions(source_id, source_type);

ALTER TABLE public.share_link_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do anything on share_link_conversions"
  ON public.share_link_conversions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
