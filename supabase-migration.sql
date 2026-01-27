-- ================================================
-- Supabase Migration Script for Futorumeshi
-- ================================================

-- Menu table
CREATE TABLE IF NOT EXISTS menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  calories INTEGER NOT NULL,
  protein INTEGER NOT NULL,
  fat INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  ingredients TEXT,
  allergens TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- News table
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  excerpt TEXT,
  content TEXT NOT NULL,
  image VARCHAR(500),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contact table
CREATE TABLE IF NOT EXISTS contact (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_created_at ON menu(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_is_published ON news(is_published);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact(status);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact(created_at DESC);

-- Enable Row Level Security
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;

-- Policies for menu table (public read, authenticated write)
CREATE POLICY "Anyone can view menu items" ON menu
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage menu items" ON menu
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for news table (public read published, authenticated write)
CREATE POLICY "Anyone can view published news" ON news
  FOR SELECT USING (is_published = true);

CREATE POLICY "Service role can manage news" ON news
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for contact table (authenticated only)
CREATE POLICY "Service role can manage contacts" ON contact
  FOR ALL USING (auth.role() = 'service_role');

-- Insert sample data (optional)
INSERT INTO menu (name, description, price, calories, protein, fat, carbs, images, features, ingredients, allergens, stock)
VALUES 
  (
    'ハンバーグ弁当',
    'ジューシーなハンバーグと彩り野菜の特製弁当',
    1290,
    1500,
    70,
    45,
    180,
    ARRAY['/bento_1.jpeg'],
    ARRAY['高タンパク質', '栄養バランス◎', 'ボリューム満点'],
    'ハンバーグ（牛肉、豚肉、玉ねぎ、パン粉、卵、牛乳）、白米、ブロッコリー、にんじん、ポテトサラダ',
    ARRAY['卵', '乳', '小麦', '牛肉', '豚肉'],
    300
  ),
  (
    '鮭の塩焼き弁当',
    '脂の乗った鮭と季節の副菜をバランスよく詰め合わせ',
    1190,
    1400,
    65,
    40,
    175,
    ARRAY['/bento_2.jpeg'],
    ARRAY['DHA・EPA豊富', '和食の基本', '塩分控えめ'],
    '銀鮭、白米、ひじき煮、きんぴらごぼう、ほうれん草のお浸し、漬物',
    ARRAY['さけ', '大豆', 'ごま'],
    300
  ),
  (
    '豚の生姜焼き弁当',
    '柔らかい豚肉を特製生姜ダレで仕上げた定番メニュー',
    1240,
    1550,
    72,
    48,
    185,
    ARRAY['/bento_3.jpeg'],
    ARRAY['スタミナ満点', '生姜で代謝UP', '食欲増進'],
    '豚肉（ロース）、白米、キャベツ、もやし、小松菜、切り干し大根',
    ARRAY['豚肉', '小麦', '大豆'],
    300
  );

INSERT INTO news (title, date, category, excerpt, content, image, is_published, published_at)
VALUES
  (
    'ふとるめし サービス開始のお知らせ',
    '2024.11.01',
    'サービス',
    '体重を増やしたい方のための高カロリー宅食サービス「ふとるめし」を開始しました。',
    '体重を増やしたい方のための高カロリー宅食サービス「ふとるめし」を開始しました。

プロテインが苦手、食が細い、忙しくて食事の時間が取れない…そんな悩みを抱える方々のために、美味しく手軽に高カロリー・高タンパクな食事をお届けします。

全てのメニューは管理栄養士監修のもと、1食あたり平均1,500kcal、タンパク質70g以上を実現。電子レンジで温めるだけで、本格的な食事をお楽しみいただけます。',
    '/news_1.jpg',
    true,
    CURRENT_TIMESTAMP
  ),
  (
    'ホームページを公開しました',
    '2024.10.25',
    'お知らせ',
    'ふとるめしの公式ホームページを公開しました。',
    'ふとるめしの公式ホームページを公開しました。

商品ラインナップ、栄養成分、お客様の声など、詳しい情報をご覧いただけます。また、オンラインでのご注文も承っております。

今後も、お客様により良いサービスをお届けできるよう、情報を随時更新してまいります。',
    '/news_2.jpg',
    true,
    CURRENT_TIMESTAMP
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_menu_updated_at BEFORE UPDATE ON menu
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_updated_at BEFORE UPDATE ON contact
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- Inventory Settings (セット単位の在庫管理)
-- ================================================

CREATE TABLE IF NOT EXISTS inventory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_type TEXT NOT NULL DEFAULT '6-set',
  stock_sets INTEGER NOT NULL DEFAULT 0 CHECK (stock_sets >= 0),
  items_per_set INTEGER NOT NULL DEFAULT 6,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 初期データ
INSERT INTO inventory_settings (set_type, stock_sets, items_per_set)
VALUES ('6-set', 0, 6)
ON CONFLICT DO NOTHING;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_inventory_settings_set_type ON inventory_settings(set_type);

-- RLS有効化
ALTER TABLE inventory_settings ENABLE ROW LEVEL SECURITY;

-- ポリシー
CREATE POLICY "Anyone can view inventory settings" ON inventory_settings
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage inventory settings" ON inventory_settings
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at トリガー
CREATE TRIGGER update_inventory_settings_updated_at BEFORE UPDATE ON inventory_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();