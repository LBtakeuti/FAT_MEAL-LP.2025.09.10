-- 部活写真共有リンク機能
-- share_links: 共有リンクの本体（slug でアクセス）
-- photos:       共有リンクに紐づく写真メタデータ
-- access_logs:  公開ページへのアクセスを記録（ユニーク数集計に使用）
-- download_logs: 写真ダウンロードを記録（single/zip 種別あり）

----------------------------------------------------------------
-- share_links
----------------------------------------------------------------
CREATE TABLE public.share_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    label TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_share_links_slug ON public.share_links(slug);
CREATE INDEX idx_share_links_created_at ON public.share_links(created_at DESC);

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read share_links by slug"
    ON public.share_links FOR SELECT
    USING (true);

CREATE POLICY "Service role can do anything on share_links"
    ON public.share_links FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

----------------------------------------------------------------
-- photos
----------------------------------------------------------------
CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,            -- Supabase Storage 上のパス（share-photos/{slug}/{filename}）
    filename TEXT NOT NULL,             -- 表示用ファイル名
    mime_type TEXT,
    size_bytes BIGINT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_share_link ON public.photos(share_link_id);
CREATE INDEX idx_photos_share_link_sort ON public.photos(share_link_id, sort_order);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read photos"
    ON public.photos FOR SELECT
    USING (true);

CREATE POLICY "Service role can do anything on photos"
    ON public.photos FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

----------------------------------------------------------------
-- access_logs
----------------------------------------------------------------
CREATE TABLE public.share_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT,
    referer TEXT
);

CREATE INDEX idx_share_access_logs_link ON public.share_access_logs(share_link_id);
CREATE INDEX idx_share_access_logs_at ON public.share_access_logs(share_link_id, accessed_at DESC);
CREATE INDEX idx_share_access_logs_link_ip ON public.share_access_logs(share_link_id, ip_address);

ALTER TABLE public.share_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do anything on share_access_logs"
    ON public.share_access_logs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

----------------------------------------------------------------
-- download_logs
----------------------------------------------------------------
CREATE TABLE public.share_download_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
    photo_id UUID REFERENCES public.photos(id) ON DELETE SET NULL,
    download_type TEXT NOT NULL CHECK (download_type IN ('single', 'zip')),
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT
);

CREATE INDEX idx_share_download_logs_link ON public.share_download_logs(share_link_id);
CREATE INDEX idx_share_download_logs_at ON public.share_download_logs(share_link_id, downloaded_at DESC);
CREATE INDEX idx_share_download_logs_type ON public.share_download_logs(share_link_id, download_type);

ALTER TABLE public.share_download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do anything on share_download_logs"
    ON public.share_download_logs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

----------------------------------------------------------------
-- Supabase Storage バケット作成（このSQLでは作成しない／手順）
----------------------------------------------------------------
-- 1. Supabase ダッシュボード > Storage > New bucket
--    Name: share-photos
--    Public bucket: ON
-- 2. バケットポリシー：認証済みユーザーのみアップロード/削除可（既存の認証ロジックで対応する場合は不要）
--    今回は管理画面のサーバーサイドAPI経由のみで write するため、Storage RLS は service role からのみ書き込み許可で良い
