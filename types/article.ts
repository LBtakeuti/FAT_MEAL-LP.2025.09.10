/**
 * F14-1: コラム記事の共通型定義。
 * articles テーブルのフィールドに対応する。
 */
export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  tags: string[];
  author: string;
  published_at: string | null;
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  view_count: number;
}
