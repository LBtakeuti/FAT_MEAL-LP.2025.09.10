CREATE TABLE public.promoter_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    referrer_id UUID REFERENCES public.referrers(id) ON DELETE SET NULL,
    title TEXT,
    blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_promoter_pages_slug ON public.promoter_pages(slug);
CREATE INDEX idx_promoter_pages_active ON public.promoter_pages(is_active) WHERE is_active = true;

ALTER TABLE public.promoter_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active promoter pages"
    ON public.promoter_pages FOR SELECT
    USING (is_active = true);

CREATE POLICY "Service role can do anything on promoter pages"
    ON public.promoter_pages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
