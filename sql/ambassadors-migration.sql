CREATE TABLE public.ambassadors (
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

CREATE INDEX idx_ambassadors_sort_order ON public.ambassadors(sort_order ASC);
CREATE INDEX idx_ambassadors_active ON public.ambassadors(is_active) WHERE is_active = true;

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;

-- 公開用（アクティブなアンバサダーのみ読み取り可）
CREATE POLICY "Anyone can read active ambassadors"
    ON public.ambassadors FOR SELECT
    USING (is_active = true);

-- 管理用
CREATE POLICY "Service role can do anything on ambassadors"
    ON public.ambassadors FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
