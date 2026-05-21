-- FAQ（よくある質問）テーブル
-- 公開LPで「お知らせ」セクションの下に表示する Q&A の管理用。
-- 管理画面 /admin/faqs から CRUD する。

CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer_title TEXT NOT NULL,
  answer_detail TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_faqs_active_sort ON public.faqs(is_active, sort_order);
CREATE INDEX idx_faqs_sort ON public.faqs(sort_order);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active faqs"
    ON public.faqs FOR SELECT
    USING (is_active = true);

CREATE POLICY "Service role can do anything on faqs"
    ON public.faqs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.touch_faqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_faqs_updated_at
  BEFORE UPDATE ON public.faqs
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_faqs_updated_at();
