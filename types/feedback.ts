export interface FeedbackItem {
  id: string;
  thumbnail_image: string;
  thumbnail_label: string | null;
  date: string;
  title: string;
  description: string;
  instagram_url: string | null;
  tiktok_url: string | null;
}
