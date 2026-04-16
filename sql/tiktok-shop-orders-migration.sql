CREATE TABLE public.tiktok_shop_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tiktok_order_id TEXT NOT NULL UNIQUE,
    order_status TEXT,
    order_substatus TEXT,
    sku_id TEXT,
    seller_sku TEXT,
    product_name TEXT,
    variation TEXT,
    quantity INTEGER DEFAULT 1,
    sku_unit_original_price TEXT,
    sku_subtotal_after_discount TEXT,
    shipping_fee_after_discount TEXT,
    order_amount TEXT,
    payment_method TEXT,
    created_time TIMESTAMPTZ,
    paid_time TIMESTAMPTZ,
    rts_time TIMESTAMPTZ,
    shipped_time TIMESTAMPTZ,
    delivered_time TIMESTAMPTZ,
    tracking_id TEXT,
    shipping_provider_name TEXT,
    buyer_username TEXT,
    recipient TEXT,
    first_name TEXT,
    last_name TEXT,
    country TEXT,
    zipcode TEXT,
    prefecture TEXT,
    county TEXT,
    city_ward TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    phone TEXT,
    product_category TEXT,
    package_id TEXT,
    seller_note TEXT,
    buyer_message TEXT,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tiktok_shop_orders_created_time ON public.tiktok_shop_orders(created_time DESC);
CREATE INDEX idx_tiktok_shop_orders_status ON public.tiktok_shop_orders(status);
CREATE INDEX idx_tiktok_shop_orders_seller_sku ON public.tiktok_shop_orders(seller_sku);

ALTER TABLE public.tiktok_shop_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do anything on tiktok_shop_orders"
    ON public.tiktok_shop_orders FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
