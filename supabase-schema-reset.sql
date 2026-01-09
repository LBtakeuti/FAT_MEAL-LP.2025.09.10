-- ==========================================
-- データベース完全リセット＆再構築スクリプト
-- ==========================================
-- 既存のテーブルを削除して、正しいスキーマで再作成します
-- 警告: このスクリプトを実行すると全てのデータが削除されます！

-- ==========================================
-- 1. 既存テーブルの削除
-- ==========================================

-- 中間テーブル（外部キー制約があるため先に削除）
DROP TABLE IF EXISTS public.news_tags CASCADE;
DROP TABLE IF EXISTS public.services_tags CASCADE;

-- メインテーブル
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.menu_items CASCADE;

-- ==========================================
-- 2. メニューアイテムテーブル
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
-- 3. ニューステーブル
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
-- 4. お問い合わせテーブル
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
-- 5. 注文テーブル
-- ==========================================

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL,
    stripe_session_id TEXT UNIQUE NOT NULL,
    stripe_payment_intent_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    menu_set TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'jpy',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_stripe_session_id ON public.orders(stripe_session_id);

-- コメント
COMMENT ON TABLE public.orders IS '注文情報';
COMMENT ON COLUMN public.orders.order_number IS '注文番号（連番）';
COMMENT ON COLUMN public.orders.stripe_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN public.orders.stripe_payment_intent_id IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN public.orders.customer_name IS '顧客名';
COMMENT ON COLUMN public.orders.customer_email IS '顧客メールアドレス';
COMMENT ON COLUMN public.orders.phone IS '電話番号';
COMMENT ON COLUMN public.orders.address IS '配送先住所';
COMMENT ON COLUMN public.orders.menu_set IS '注文セット内容';
COMMENT ON COLUMN public.orders.quantity IS '数量';
COMMENT ON COLUMN public.orders.amount IS '合計金額';
COMMENT ON COLUMN public.orders.currency IS '通貨';
COMMENT ON COLUMN public.orders.status IS 'ステータス';
COMMENT ON COLUMN public.orders.notes IS '備考';

-- ==========================================
-- 6. Row Level Security (RLS) 設定
-- ==========================================

-- RLSを有効化
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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
-- メニュー管理
CREATE POLICY "menu_items_admin_all_policy" ON public.menu_items
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ニュース管理
CREATE POLICY "news_admin_all_policy" ON public.news
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- お問い合わせ管理
CREATE POLICY "contacts_admin_select_policy" ON public.contacts
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "contacts_admin_update_policy" ON public.contacts
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 注文管理（Webhook用のINSERTと管理者用の閲覧・更新）
CREATE POLICY "orders_service_insert_policy" ON public.orders
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "orders_admin_select_policy" ON public.orders
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "orders_admin_update_policy" ON public.orders
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 6. 更新日時の自動更新トリガー
-- ==========================================

-- トリガー関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- 注文のトリガー
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 7. サンプルデータ（オプション）
-- ==========================================

-- サンプルメニュー
INSERT INTO public.menu_items (name, description, price, calories, protein, fat, carbs, features, ingredients, allergens, stock) VALUES
('高タンパク弁当A', '筋肉をつけたいアスリート向けの高タンパク質弁当', 1200, 800, 60, 20, 80, ARRAY['高タンパク', '低脂質'], ARRAY['鶏むね肉', '玄米', 'ブロッコリー'], ARRAY['なし'], 50),
('バランス弁当B', '栄養バランスを考えた健康弁当', 1000, 650, 35, 18, 75, ARRAY['バランス栄養'], ARRAY['鮭', '雑穀米', '野菜'], ARRAY['なし'], 30);

-- サンプルニュース
INSERT INTO public.news (title, content, date, category) VALUES
('サービス開始のお知らせ', 'フトルメシのサービスを開始しました。アスリート向けの栄養管理された弁当をお届けします。', CURRENT_DATE, 'お知らせ'),
('新メニュー追加', '新しい高タンパク弁当を追加しました。', CURRENT_DATE - INTERVAL '1 day', '商品情報');

-- ==========================================
-- スクリプト完了
-- ==========================================




