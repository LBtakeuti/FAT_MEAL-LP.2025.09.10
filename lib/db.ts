// シンプルなインメモリデータベース（本番環境では実際のDBを使用）
import { menuItems as staticMenuItems } from '@/data/menuData';
import { newsItems as staticNewsItems } from '@/data/newsData';

export interface MenuItemDB {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
  images: string[]; // 複数画像対応
  features: string[];
  ingredients: string[];
  allergens: string[];
  stock: number; // 在庫数
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsItemDB {
  id: string;
  title: string;
  date: string;
  category: string;
  content: string;
  excerpt: string;
  image?: string;
  isPublished?: boolean;
  publishedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

// インメモリストレージ（開発用）
class Database {
  private menuItems: Map<string, MenuItemDB>;
  private newsItems: Map<string, NewsItemDB>;
  private static instance: Database;

  private constructor() {
    this.menuItems = new Map();
    this.newsItems = new Map();
    this.initializeData();
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private initializeData() {
    // 静的データから初期化
    staticMenuItems.forEach(item => {
      this.menuItems.set(item.id, {
        ...item,
        images: [item.image], // 既存の画像を配列に変換
        stock: 300, // 初期在庫数
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    staticNewsItems.forEach(item => {
      this.newsItems.set(item.id, {
        ...item,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
  }

  // メニューアイテム操作
  getAllMenuItems(): MenuItemDB[] {
    return Array.from(this.menuItems.values());
  }

  getMenuItem(id: string): MenuItemDB | undefined {
    return this.menuItems.get(id);
  }

  createMenuItem(item: Omit<MenuItemDB, 'id' | 'createdAt' | 'updatedAt'>): MenuItemDB {
    const id = `menu-${Date.now()}`;
    const newItem: MenuItemDB = {
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.menuItems.set(id, newItem);
    return newItem;
  }

  updateMenuItem(id: string, updates: Partial<Omit<MenuItemDB, 'id' | 'createdAt'>>): MenuItemDB | undefined {
    const item = this.menuItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date()
    };
    this.menuItems.set(id, updatedItem);
    return updatedItem;
  }

  deleteMenuItem(id: string): boolean {
    return this.menuItems.delete(id);
  }

  // 在庫操作
  updateStock(id: string, quantity: number): boolean {
    const item = this.menuItems.get(id);
    if (!item) return false;
    
    item.stock = Math.max(0, item.stock + quantity);
    item.updatedAt = new Date();
    this.menuItems.set(id, item);
    return true;
  }

  // ニュース操作
  getAllNewsItems(): NewsItemDB[] {
    return Array.from(this.newsItems.values());
  }

  getNewsItem(id: string): NewsItemDB | undefined {
    return this.newsItems.get(id);
  }

  createNewsItem(item: Omit<NewsItemDB, 'id' | 'createdAt' | 'updatedAt'>): NewsItemDB {
    const id = `news-${Date.now()}`;
    const newItem: NewsItemDB = {
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.newsItems.set(id, newItem);
    return newItem;
  }

  updateNewsItem(id: string, updates: Partial<Omit<NewsItemDB, 'id' | 'createdAt'>>): NewsItemDB | undefined {
    const item = this.newsItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date()
    };
    this.newsItems.set(id, updatedItem);
    return updatedItem;
  }

  deleteNewsItem(id: string): boolean {
    return this.newsItems.delete(id);
  }
}

export const db = Database.getInstance();