/**
 * 統一型定義ファイル
 * プロジェクト全体で使用する型を一元管理
 */

// Export all types
export * from './ambassador';
export * from './feedback';

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
  weight: number | null;
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
  weight: string;
  image: string;
  images?: string[];
  features: string[];
  ingredients: string[];
  allergens: string[];
  stock?: number;
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

