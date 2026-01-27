/**
 * 統一型定義ファイル
 * プロジェクト全体で使用する型を一元管理
 */

// ============================================
// メニューアイテム
// ============================================

/** データベース保存形式（Supabase準拠） */
export interface MenuItemDB {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  main_image: string | null;
  sub_images: string[] | null;
  ingredients: string[] | null;
  allergens: string[] | null;
  stock: number | null;
  slug: string | null;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

/** メニューアイテム作成用 */
export type MenuItemCreate = Omit<MenuItemDB, 'id' | 'created_at' | 'updated_at'>;

/** メニューアイテム更新用 */
export type MenuItemUpdate = Partial<Omit<MenuItemDB, 'id' | 'created_at'>>;

/** フロントエンド表示用（互換性のため） */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  image: string;
  images?: string[];
  features: string[];
  ingredients: string[];
  allergens: string[];
  stock?: number;
}

/** DB形式からフロントエンド形式への変換 */
export function toMenuItem(db: MenuItemDB): MenuItem {
  // sub_imagesとmain_imageを統合してimages配列を作成
  const images: string[] = [];
  if (db.main_image) images.push(db.main_image);
  if (db.sub_images) images.push(...db.sub_images);

  return {
    id: db.id,
    name: db.name,
    description: db.description || '',
    price: String(db.price || 0),
    calories: String(db.calories),
    protein: String(db.protein),
    fat: String(db.fat),
    carbs: String(db.carbs),
    image: db.main_image || '/placeholder.jpg',
    images: images.length > 0 ? images : undefined,
    features: [], // データベースにfeaturesカラムがないため空配列
    ingredients: db.ingredients || [],
    allergens: db.allergens || [],
    stock: db.stock ?? undefined,
  };
}

/** フロントエンド形式からDB形式への変換 */
export function toMenuItemDB(item: MenuItem): Partial<MenuItemDB> {
  const allImages = item.images || [item.image];
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price) || 0,
    calories: Number(item.calories) || 0,
    protein: Number(item.protein) || 0,
    fat: Number(item.fat) || 0,
    carbs: Number(item.carbs) || 0,
    main_image: allImages[0] || null,
    sub_images: allImages.slice(1).length > 0 ? allImages.slice(1) : null,
    ingredients: item.ingredients,
    allergens: item.allergens,
    stock: item.stock || 0,
  };
}

// ============================================
// ニュース
// ============================================

/** データベース保存形式（Supabase準拠） */
export interface NewsItemDB {
  id: string;
  title: string;
  content: string;
  date: string | null;
  category: string | null;
  image: string | null;
  excerpt: string | null;
  summary: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** ニュース作成用 */
export type NewsItemCreate = Omit<NewsItemDB, 'id' | 'created_at' | 'updated_at'>;

/** ニュース更新用 */
export type NewsItemUpdate = Partial<Omit<NewsItemDB, 'id' | 'created_at'>>;

/** フロントエンド表示用 */
export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  category?: string;
  image?: string;
  excerpt?: string;
  summary?: string;
}

/** DB形式からフロントエンド形式への変換 */
export function toNewsItem(db: NewsItemDB): NewsItem {
  return {
    id: db.id,
    title: db.title,
    content: db.content,
    date: db.date || '',
    category: db.category || undefined,
    image: db.image || undefined,
    excerpt: db.excerpt || undefined,
    summary: db.summary || undefined,
  };
}

// ============================================
// お問い合わせ
// ============================================

/** お問い合わせステータス */
export type ContactStatus = 'pending' | 'responded' | 'closed';

/** データベース保存形式（Supabase準拠） */
export interface ContactDB {
  id: string;
  name: string;
  name_kana: string | null;
  email: string;
  phone: string | null;
  title: string | null;
  message: string;
  status: string | null;
  created_at: string | null;
}

/** お問い合わせ作成用 */
export type ContactCreate = Omit<ContactDB, 'id' | 'created_at' | 'status'>;

/** フロントエンド表示用 */
export interface Contact {
  id: string;
  name: string;
  nameKana?: string;
  email: string;
  phone?: string;
  title?: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

/** DB形式からフロントエンド形式への変換 */
export function toContact(db: ContactDB): Contact {
  return {
    id: db.id,
    name: db.name,
    nameKana: db.name_kana || undefined,
    email: db.email,
    phone: db.phone || undefined,
    title: db.title || undefined,
    message: db.message,
    status: (db.status as ContactStatus) || 'pending',
    createdAt: db.created_at || '',
  };
}

// ============================================
// 注文
// ============================================

/** 注文ステータス */
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

/** 注文アイテム */
export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

/** データベース保存形式 */
export interface OrderDB {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// API レスポンス
// ============================================

/** 成功レスポンス */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/** エラーレスポンス */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
}

/** API レスポンス */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================
// 認証
// ============================================

/** 認証結果 */
export interface AuthResult {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
  error?: string;
}

// ============================================
// ページネーション
// ============================================

/** ページネーション情報 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** ページネーション付きレスポンス */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// ============================================
// 在庫管理（セット単位）
// ============================================

/** 在庫設定（データベース形式） */
export interface InventorySettingsDB {
  id: string;
  set_type: string;
  stock_sets: number;
  items_per_set: number;
  updated_at: string;
}

/** 在庫設定（フロントエンド形式） */
export interface InventorySettings {
  id: string;
  setType: string;
  stockSets: number;
  itemsPerSet: number;
  updatedAt: string;
}

/** 在庫チェック結果 */
export interface InventoryCheckResult {
  available: boolean;
  stockSets: number;
  totalMeals: number;
  sets: {
    'plan-6': boolean;
    'plan-12': boolean;
    'plan-18': boolean;
  };
  maxQuantity: {
    'plan-6': number;
    'plan-12': number;
    'plan-18': number;
  };
}

/** DB形式からフロントエンド形式への変換 */
export function toInventorySettings(db: InventorySettingsDB): InventorySettings {
  return {
    id: db.id,
    setType: db.set_type,
    stockSets: db.stock_sets,
    itemsPerSet: db.items_per_set,
    updatedAt: db.updated_at,
  };
}
