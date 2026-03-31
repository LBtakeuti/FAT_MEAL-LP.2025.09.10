export interface FeedbackItem {
  id: string;
  thumbnail_image: string;
  thumbnail_label: string | null;
  date: string;
  title: string;
  description: string;
  sns_type: string | null;
  sns_url: string | null;
  sns_embed_active: boolean | null;
}
