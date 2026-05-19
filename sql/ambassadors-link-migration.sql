-- アンバサダー管理を「人ハブ」に格上げするためのリンク列追加
-- referrers / promoter_pages テーブル本体は無改修（webhook依存性のため）
ALTER TABLE public.ambassadors
  ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.referrers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promoter_page_id UUID REFERENCES public.promoter_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ambassadors_referrer ON public.ambassadors(referrer_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_promoter_page ON public.ambassadors(promoter_page_id);
