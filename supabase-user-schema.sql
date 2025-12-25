-- ==========================================
-- ユーザー認証・プロフィール・カート機能用テーブル
-- ==========================================
-- Supabase Authのusersテーブルと連携するテーブルを作成します

-- ==========================================
-- 1. ユーザープロフィールテーブル
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    last_name TEXT,
    first_name TEXT,
    last_name_kana TEXT,
    first_name_kana TEXT,
    phone TEXT,
    postal_code TEXT,
    prefecture TEXT,
    city TEXT,
    address_detail TEXT,
    building TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- コメント
COMMENT ON TABLE public.user_profiles IS 'ユーザープロフィール情報';
COMMENT ON COLUMN public.user_profiles.id IS 'ユーザーID（auth.users.idと連携）';
COMMENT ON COLUMN public.user_profiles.email IS 'メールアドレス';
COMMENT ON COLUMN public.user_profiles.last_name IS '姓';
COMMENT ON COLUMN public.user_profiles.first_name IS '名';
COMMENT ON COLUMN public.user_profiles.last_name_kana IS '姓（カナ）';
COMMENT ON COLUMN public.user_profiles.first_name_kana IS '名（カナ）';
COMMENT ON COLUMN public.user_profiles.phone IS '電話番号';
COMMENT ON COLUMN public.user_profiles.postal_code IS '郵便番号';
COMMENT ON COLUMN public.user_profiles.prefecture IS '都道府県';
COMMENT ON COLUMN public.user_profiles.city IS '市区町村';
COMMENT ON COLUMN public.user_profiles.address_detail IS '番地';
COMMENT ON COLUMN public.user_profiles.building IS '建物名';

-- ==========================================
-- 2. カートテーブル
-- ==========================================

CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);

-- コメント
COMMENT ON TABLE public.carts IS 'ユーザーのカート';
COMMENT ON COLUMN public.carts.user_id IS 'ユーザーID（auth.users.idと連携）';

-- ==========================================
-- 3. カートアイテムテーブル
-- ==========================================

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, menu_item_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_menu_item_id ON public.cart_items(menu_item_id);

-- コメント
COMMENT ON TABLE public.cart_items IS 'カート内の商品';
COMMENT ON COLUMN public.cart_items.cart_id IS 'カートID';
COMMENT ON COLUMN public.cart_items.menu_item_id IS 'メニューアイテムID';
COMMENT ON COLUMN public.cart_items.quantity IS '数量';

-- ==========================================
-- 4. Row Level Security (RLS) 設定
-- ==========================================

-- RLSを有効化
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- ユーザープロフィールのRLSポリシー
-- ユーザーは自分のプロフィールのみ閲覧・更新可能
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- カートのRLSポリシー
-- ユーザーは自分のカートのみ閲覧・作成可能
CREATE POLICY "Users can view their own cart"
    ON public.carts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cart"
    ON public.carts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- カートアイテムのRLSポリシー
-- ユーザーは自分のカートのアイテムのみ閲覧・操作可能
CREATE POLICY "Users can view their own cart items"
    ON public.cart_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own cart items"
    ON public.cart_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own cart items"
    ON public.cart_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own cart items"
    ON public.cart_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.carts
            WHERE carts.id = cart_items.cart_id
            AND carts.user_id = auth.uid()
        )
    );

-- ==========================================
-- 5. トリガー関数（updated_at自動更新）
-- ==========================================

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを設定
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at
    BEFORE UPDATE ON public.carts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 6. ユーザー作成時にプロフィールとカートを自動作成する関数
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- ユーザープロフィールを作成
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    
    -- カートを作成
    INSERT INTO public.carts (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを設定（auth.usersにユーザーが作成されたときに実行）
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- スクリプト完了
-- ==========================================

