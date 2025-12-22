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
  description: string;
  price: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  images: string[];
  features: string[];
  ingredients: string[];
  allergens: string[];
  stock: number;
  slug?: string;
  created_at: string;
  updated_at: string;
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
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    price: String(db.price),
    calories: String(db.calories),
    protein: String(db.protein),
    fat: String(db.fat),
    carbs: String(db.carbs),
    image: db.images[0] || '/placeholder.jpg',
    images: db.images,
    features: db.features,
    ingredients: db.ingredients,
    allergens: db.allergens,
    stock: db.stock,
  };
}

/** フロントエンド形式からDB形式への変換 */
export function toMenuItemDB(item: MenuItem): Partial<MenuItemDB> {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price) || 0,
    calories: Number(item.calories) || 0,
    protein: Number(item.protein) || 0,
    fat: Number(item.fat) || 0,
    carbs: Number(item.carbs) || 0,
    images: item.images || [item.image],
    features: item.features,
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
  date: string;
  category: string | null;
  image: string | null;
  excerpt: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
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
    date: db.date,
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
  email: string;
  phone: string;
  message: string;
  status: ContactStatus;
  created_at: string;
}

/** お問い合わせ作成用 */
export type ContactCreate = Omit<ContactDB, 'id' | 'created_at' | 'status'>;

/** フロントエンド表示用 */
export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

/** DB形式からフロントエンド形式への変換 */
export function toContact(db: ContactDB): Contact {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    message: db.message,
    status: db.status,
    createdAt: db.created_at,
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
