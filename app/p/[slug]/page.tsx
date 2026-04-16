import { redirect } from 'next/navigation';
import { createServerClient, getMenuItemsServer } from '@/lib/supabase';
import HomeContent from '@/components/pages/HomeContent';
import type { MenuItem } from '@/types';
import type { PromoterPage, PromoterBlock } from '@/lib/types/promoter';
import { isPromoterBlockArray } from '@/lib/types/promoter';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPromoterPage(slug: string): Promise<PromoterPage | null> {
  const supabase = createServerClient();
  const client = supabase as unknown as { from: (table: string) => any };
  const { data, error } = await client
    .from('promoter_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  const blocks: PromoterBlock[] = isPromoterBlockArray(data.blocks) ? data.blocks : [];

  return {
    id: data.id,
    slug: data.slug,
    referrer_id: data.referrer_id ?? null,
    title: data.title ?? null,
    blocks,
    is_active: data.is_active,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export default async function PromoterSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const promoterPage = await fetchPromoterPage(slug);
  if (!promoterPage) redirect('/');

  const supabase = createServerClient();
  (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<unknown> })
    .rpc('increment_promoter_page_view', { page_slug: slug })
    .catch((e: unknown) => console.error('Failed to increment view_count:', e));

  const menuItemsDB = await getMenuItemsServer(6);
  const menuItems: MenuItem[] = menuItemsDB.map((item) => ({
    id: item.slug || item.id,
    name: item.name,
    description: item.description || '',
    price: String(item.price || 0),
    calories: String(item.calories || 0),
    protein: String(item.protein || 0),
    fat: String(item.fat || 0),
    carbs: String(item.carbs || 0),
    weight: String(item.weight ?? ''),
    image: item.main_image || '',
    features: [],
    ingredients: item.ingredients || [],
    allergens: item.allergens || [],
  }));

  return <HomeContent menuItems={menuItems} promoterPage={promoterPage} />;
}
