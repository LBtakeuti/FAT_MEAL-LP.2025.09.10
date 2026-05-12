-- レビュー（お客様の声・短文）テーブル
-- メニューセクション直下に表示する短文の口コミ
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icon_url TEXT,                                          -- カスタムアップロード時のURL（NULLの場合 icon_preset を使用）
    icon_preset TEXT                                        -- プリセットアバター: 'woman_1blue' / 'man_3red' など10種
        CHECK (
            icon_preset IS NULL OR icon_preset IN (
                'woman_1blue','woman_2gray','woman_3blue','woman_3pink','woman_3yellow',
                'man_2','man_3blue','man_3blue2','man_3pink','man_3red'
            )
        ),
    name TEXT NOT NULL,
    comment TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5
        CHECK (rating BETWEEN 1 AND 5),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- icon_url または icon_preset のいずれかが必須
    CONSTRAINT reviews_icon_required CHECK (icon_url IS NOT NULL OR icon_preset IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_reviews_sort_order ON public.reviews(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_reviews_active ON public.reviews(is_active) WHERE is_active = true;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 公開：アクティブなレビューのみ読み取り可
CREATE POLICY "Anyone can read active reviews"
    ON public.reviews FOR SELECT
    USING (is_active = true);

-- 管理：service_role のみ全権
CREATE POLICY "Service role can do anything on reviews"
    ON public.reviews FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
