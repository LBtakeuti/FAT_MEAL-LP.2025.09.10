export type PromoterBlock =
  | { type: 'image'; value: string; alt?: string }
  | { type: 'text'; value: string };

export interface PromoterPage {
  id: string;
  slug: string;
  referrer_id: string | null;
  title: string | null;
  blocks: PromoterBlock[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function isPromoterBlockArray(value: unknown): value is PromoterBlock[] {
  if (!Array.isArray(value)) return false;
  return value.every((b) => {
    if (!b || typeof b !== 'object') return false;
    const block = b as { type?: unknown; value?: unknown };
    if (block.type === 'image' || block.type === 'text') {
      return typeof block.value === 'string';
    }
    return false;
  });
}
