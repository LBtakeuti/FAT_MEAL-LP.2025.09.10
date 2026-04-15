CREATE TABLE public.individual_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    body_html TEXT NOT NULL DEFAULT '',
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_individual_messages_slug ON public.individual_messages(slug);
CREATE INDEX idx_individual_messages_active ON public.individual_messages(is_active) WHERE is_active = true;

ALTER TABLE public.individual_messages ENABLE ROW LEVEL SECURITY;

-- 公開用（アクティブなメッセージのみ、スラグで読み取り可）
CREATE POLICY "Anyone can read active individual messages"
    ON public.individual_messages FOR SELECT
    USING (is_active = true);

-- 管理用（service roleは全操作可能）
CREATE POLICY "Service role can do anything on individual messages"
    ON public.individual_messages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
