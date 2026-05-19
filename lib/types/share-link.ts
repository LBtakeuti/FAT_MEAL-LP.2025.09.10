export interface ShareLink {
  id: string;
  slug: string;
  label: string | null;
  title: string | null;
  body_html: string;
  expires_at: string | null;
  created_at: string;
}

export interface SharePhoto {
  id: string;
  share_link_id: string;
  file_path: string;
  filename: string;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  uploaded_at: string;
  /** クライアント側で取り回しやすいよう public URL を一緒に返す */
  url?: string;
}

export interface ShareLinkWithStats extends ShareLink {
  photo_count: number;
  access_count: number;
  unique_access_count: number;
  download_count: number;
}

export interface ShareLinkStats {
  total_access: number;
  unique_access: number;
  total_downloads: number;
  single_downloads: number;
  zip_downloads: number;
  /** YYYY-MM-DD → 件数 */
  daily_access: Array<{ date: string; count: number }>;
  daily_downloads: Array<{ date: string; count: number }>;
}

export interface ShareLinkDetail {
  link: ShareLink;
  photos: SharePhoto[];
}
