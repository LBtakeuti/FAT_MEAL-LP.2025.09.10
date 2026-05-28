-- F14: コラム機能用 articles テーブル新設
-- 設計：設計メート（リード）
-- 適用前に keitakeuchi 承認必須

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- URL/SEO 用
  slug TEXT UNIQUE NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,

  -- コンテンツ本体
  title TEXT NOT NULL,
  excerpt TEXT,                          -- 一覧表示用の抜粋
  content TEXT NOT NULL,                 -- Markdown形式の本文
  thumbnail_url TEXT,                    -- 一覧のサムネ
  tags TEXT[] DEFAULT '{}',              -- ['太りたい', '部活', '栄養'] 等

  -- 著者
  author TEXT NOT NULL DEFAULT 'ふとるめし編集部',

  -- 公開管理
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,

  -- アクセス計測
  view_count INTEGER NOT NULL DEFAULT 0,

  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.articles IS 'コラム記事（SEO向けブログ）';
COMMENT ON COLUMN public.articles.slug IS 'URL スラッグ（/blog/<slug>）';
COMMENT ON COLUMN public.articles.excerpt IS '一覧画面とOG description用の抜粋';
COMMENT ON COLUMN public.articles.content IS 'Markdown 形式の本文';
COMMENT ON COLUMN public.articles.tags IS 'タグ配列。記事絞り込みやSEOで使用';
COMMENT ON COLUMN public.articles.is_published IS 'true で公開。false は下書き';
COMMENT ON COLUMN public.articles.published_at IS '公開日時。一覧の並び順とOG date に使用';

-- インデックス
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_articles_tags ON public.articles USING GIN(tags);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_set_updated_at ON public.articles;
CREATE TRIGGER articles_set_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS（Row Level Security）
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 公開済み記事は誰でも閲覧可能
DROP POLICY IF EXISTS "public can read published articles" ON public.articles;
CREATE POLICY "public can read published articles" ON public.articles
  FOR SELECT
  USING (is_published = true);

-- service_role（管理画面・API経由）はフルアクセス
DROP POLICY IF EXISTS "service role full access" ON public.articles;
CREATE POLICY "service role full access" ON public.articles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
