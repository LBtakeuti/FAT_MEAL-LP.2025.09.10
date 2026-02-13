CREATE TABLE public.feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thumbnail_image TEXT NOT NULL,
    thumbnail_label TEXT,
    icon_image TEXT NOT NULL,
    department TEXT,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedbacks_sort_order ON public.feedbacks(sort_order ASC);
CREATE INDEX idx_feedbacks_active ON public.feedbacks(is_active) WHERE is_active = true;

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- 公開用（アクティブなフィードバックのみ読み取り可）
CREATE POLICY "Anyone can read active feedbacks"
    ON public.feedbacks FOR SELECT
    USING (is_active = true);

-- 管理用
CREATE POLICY "Service role can do anything on feedbacks"
    ON public.feedbacks FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
