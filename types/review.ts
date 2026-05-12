export type ReviewIconPreset =
  | 'woman_1blue'
  | 'woman_2gray'
  | 'woman_3blue'
  | 'woman_3pink'
  | 'woman_3yellow'
  | 'man_2'
  | 'man_3blue'
  | 'man_3blue2'
  | 'man_3pink'
  | 'man_3red';

export const REVIEW_ICON_PRESETS: ReviewIconPreset[] = [
  'woman_1blue',
  'woman_2gray',
  'woman_3blue',
  'woman_3pink',
  'woman_3yellow',
  'man_2',
  'man_3blue',
  'man_3blue2',
  'man_3pink',
  'man_3red',
];

export function presetToUrl(preset: ReviewIconPreset): string {
  return `/images/reviews/avatars/avatar_${preset}.svg`;
}

export interface ReviewItem {
  id: string;
  icon_url: string | null;
  icon_preset: ReviewIconPreset | null;
  name: string;
  comment: string;
  rating: number;
}

export interface ReviewItemAdmin extends ReviewItem {
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
