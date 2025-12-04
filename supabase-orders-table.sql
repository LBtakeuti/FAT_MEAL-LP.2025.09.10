-- ==========================================
-- 注文管理テーブル作成スクリプト
-- ==========================================

-- ==========================================
-- 1. 注文番号用シーケンスの作成
-- ==========================================

-- 既存のシーケンスを削除（存在する場合）
DROP SEQUENCE IF EXISTS public.order_number_seq CASCADE;

-- 1000001から開始するシーケンスを作成
CREATE SEQUENCE public.order_number_seq
    START WITH 1000001
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

-- ==========================================
-- 2. 注文テーブルの作成
-- ==========================================

-- 既存のテーブルを削除（存在する場合）
DROP TABLE IF EXISTS public.orders CASCADE;

-- 注文テーブルを作成
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number BIGINT UNIQUE NOT NULL DEFAULT nextval('public.order_number_seq'),
    customer_name TEXT NOT NULL,
    address TEXT NOT NULL,
    menu_set TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 3. インデックスの作成
-- ==========================================

CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_email ON public.orders(email);

-- ==========================================
-- 4. コメント
-- ==========================================

COMMENT ON TABLE public.orders IS '注文情報';
COMMENT ON COLUMN public.orders.id IS 'UUID（内部ID）';
COMMENT ON COLUMN public.orders.order_number IS '注文番号（1000001から自動採番）';
COMMENT ON COLUMN public.orders.customer_name IS '注文者氏名';
COMMENT ON COLUMN public.orders.address IS '配送先住所';
COMMENT ON COLUMN public.orders.menu_set IS 'セット名';
COMMENT ON COLUMN public.orders.quantity IS '数量';
COMMENT ON COLUMN public.orders.phone IS '電話番号';
COMMENT ON COLUMN public.orders.email IS 'メールアドレス';
COMMENT ON COLUMN public.orders.status IS 'ステータス（pending/confirmed/shipped/delivered/cancelled）';
COMMENT ON COLUMN public.orders.created_at IS '注文日時';
COMMENT ON COLUMN public.orders.updated_at IS '更新日時';

-- ==========================================
-- 5. Row Level Security (RLS) 設定
-- ==========================================

-- RLSを有効化
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 管理者用ポリシー（認証済みユーザー）
CREATE POLICY "orders_admin_all_policy" ON public.orders
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ==========================================
-- 6. 更新日時の自動更新トリガー
-- ==========================================

-- トリガーを作成（update_updated_at_column関数は既に存在する前提）
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 7. サンプルデータ（テスト用）
-- ==========================================

INSERT INTO public.orders (customer_name, address, menu_set, quantity, phone, email, status) VALUES
('山田太郎', '東京都渋谷区1-2-3', '高タンパク24食セット', 1, '090-1234-5678', 'yamada@example.com', 'pending'),
('鈴木花子', '大阪府大阪市北区4-5-6', 'バランス栄養12食セット', 2, '080-9876-5432', 'suzuki@example.com', 'confirmed'),
('佐藤次郎', '愛知県名古屋市中区7-8-9', '筋肉増強24食セット', 1, '070-1111-2222', 'sato@example.com', 'shipped');

-- ==========================================
-- スクリプト完了
-- ==========================================
