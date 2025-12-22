-- ==========================================
-- フトルメシ データベースセットアップ
-- ==========================================

-- ==========================================
-- 1. メニューアイテムテーブル
-- ==========================================

CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    calories INTEGER NOT NULL CHECK (calories >= 0),
    protein DECIMAL(10,2) NOT NULL CHECK (protein >= 0),
    fat DECIMAL(10,2) NOT NULL CHECK (fat >= 0),
    carbs DECIMAL(10,2) NOT NULL CHECK (carbs >= 0),
    images TEXT[] NOT NULL DEFAULT '{}',
    features TEXT[] NOT NULL DEFAULT '{}',
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    allergens TEXT[] NOT NULL DEFAULT '{}',
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_menu_items_created_at ON public.menu_items(created_at DESC);
CREATE INDEX idx_menu_items_stock ON public.menu_items(stock);

-- コメント
COMMENT ON TABLE public.menu_items IS '商品メニュー';
COMMENT ON COLUMN public.menu_items.name IS '商品名';
COMMENT ON COLUMN public.menu_items.description IS '商品説明';
COMMENT ON COLUMN public.menu_items.price IS '価格（円）';
COMMENT ON COLUMN public.menu_items.calories IS 'カロリー（kcal）';
COMMENT ON COLUMN public.menu_items.protein IS 'タンパク質（g）';
COMMENT ON COLUMN public.menu_items.fat IS '脂質（g）';
COMMENT ON COLUMN public.menu_items.carbs IS '炭水化物（g）';
COMMENT ON COLUMN public.menu_items.images IS '画像URL配列';
COMMENT ON COLUMN public.menu_items.features IS '特徴タグ配列';
COMMENT ON COLUMN public.menu_items.ingredients IS '原材料配列';
COMMENT ON COLUMN public.menu_items.allergens IS 'アレルゲン配列';
COMMENT ON COLUMN public.menu_items.stock IS '在庫数';

-- ==========================================
-- 2. ニューステーブル
-- ==========================================

CREATE TABLE public.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NULL,
    image TEXT NULL,
    excerpt TEXT NULL,
    summary TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_news_date ON public.news(date DESC);
CREATE INDEX idx_news_category ON public.news(category);
CREATE INDEX idx_news_created_at ON public.news(created_at DESC);

-- コメント
COMMENT ON TABLE public.news IS 'ニュース記事';
COMMENT ON COLUMN public.news.title IS 'タイトル';
COMMENT ON COLUMN public.news.content IS '本文';
COMMENT ON COLUMN public.news.date IS '公開日';
COMMENT ON COLUMN public.news.category IS 'カテゴリー';
COMMENT ON COLUMN public.news.image IS 'アイキャッチ画像URL';
COMMENT ON COLUMN public.news.excerpt IS '抜粋';
COMMENT ON COLUMN public.news.summary IS '要約';

-- ==========================================
-- 3. お問い合わせテーブル
-- ==========================================

CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at DESC);
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_contacts_email ON public.contacts(email);

-- コメント
COMMENT ON TABLE public.contacts IS 'お問い合わせ';
COMMENT ON COLUMN public.contacts.name IS '名前';
COMMENT ON COLUMN public.contacts.email IS 'メールアドレス';
COMMENT ON COLUMN public.contacts.phone IS '電話番号';
COMMENT ON COLUMN public.contacts.message IS 'メッセージ内容';
COMMENT ON COLUMN public.contacts.status IS 'ステータス（pending/responded/closed）';

-- ==========================================
-- 4. Row Level Security (RLS) 設定
-- ==========================================

-- RLSを有効化
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー（全ユーザー）
CREATE POLICY "menu_items_select_policy" ON public.menu_items
    FOR SELECT
    USING (true);

CREATE POLICY "news_select_policy" ON public.news
    FOR SELECT
    USING (true);

-- お問い合わせは作成のみ許可（全ユーザー）
CREATE POLICY "contacts_insert_policy" ON public.contacts
    FOR INSERT
    WITH CHECK (true);

-- 管理者用ポリシー（認証済みユーザー）
CREATE POLICY "menu_items_admin_write_policy" ON public.menu_items
    FOR ALL
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "news_admin_write_policy" ON public.news
    FOR ALL
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "contacts_admin_read_policy" ON public.contacts
    FOR SELECT
    USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "contacts_admin_update_policy" ON public.contacts
    FOR UPDATE
    USING ((SELECT auth.role()) = 'authenticated')
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 5. 更新日時の自動更新トリガー
-- ==========================================

-- トリガー関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- メニューアイテムのトリガー
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ニュースのトリガー
CREATE TRIGGER update_news_updated_at
    BEFORE UPDATE ON public.news
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 6. サンプルデータ
-- ==========================================

-- サンプルメニュー
INSERT INTO public.menu_items (name, description, price, calories, protein, fat, carbs, features, ingredients, allergens, stock) VALUES
('高タンパク弁当A', '筋肉をつけたいアスリート向けの高タンパク質弁当。鶏むね肉をメインに、玄米とブロッコリーで栄養バランスを整えました。', 1200, 800, 60, 20, 80, ARRAY['高タンパク', '低脂質', 'アスリート向け'], ARRAY['鶏むね肉', '玄米', 'ブロッコリー', 'にんじん'], ARRAY['なし'], 50),
('バランス弁当B', '栄養バランスを考えた健康弁当。鮭と雑穀米を中心に、多彩な野菜で彩りも栄養も満点です。', 1000, 650, 35, 18, 75, ARRAY['バランス栄養', '野菜たっぷり'], ARRAY['鮭', '雑穀米', 'ほうれん草', 'パプリカ', 'きのこ類'], ARRAY['なし'], 30),
('減量サポート弁当', 'ダイエット中でもしっかり食べられる低カロリー・高タンパク弁当', 950, 500, 45, 12, 55, ARRAY['低カロリー', '高タンパク', 'ダイエット向け'], ARRAY['ささみ', 'こんにゃく米', 'キャベツ', '豆腐'], ARRAY['大豆'], 40);

-- サンプルニュース
INSERT INTO public.news (title, content, date, category, excerpt) VALUES
('サービス開始のお知らせ', 'この度、フトルメシのサービスを開始いたしました。アスリートの皆様に、栄養管理された美味しい弁当をお届けします。管理栄養士が監修したメニューで、目標達成をサポートいたします。', CURRENT_DATE, 'お知らせ', 'フトルメシのサービスを開始しました'),
('新メニュー追加のお知らせ', '新しい高タンパク弁当「減量サポート弁当」を追加しました。低カロリーでありながら、必要なタンパク質をしっかり摂取できる設計になっています。', CURRENT_DATE - INTERVAL '2 days', '商品情報', '減量サポート弁当が新登場'),
('年末年始の配送について', '年末年始の配送スケジュールについてお知らせいたします。12月29日〜1月3日は配送をお休みさせていただきます。', CURRENT_DATE - INTERVAL '5 days', 'お知らせ', '年末年始の配送スケジュール');

-- ==========================================
-- セットアップ完了
-- ==========================================
