import { notFound } from 'next/navigation';
import { createServerClient, getMenuItemsServer } from '@/lib/supabase';
import { isValidShareLinkSlug } from '@/lib/share-link-slug';
import { getSharePhotoUrl } from '@/lib/share-storage';
import HomeContent from '@/components/pages/HomeContent';
import type { MenuItem } from '@/types';

interface ShareLink {
  id: string;
  slug: string;
  label: string | null;
  title: string | null;
  body_html: string;
  expires_at: string | null;
  created_at: string;
}

interface SharePhotoRow {
  id: string;
  filename: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
}

export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidShareLinkSlug(slug)) notFound();

  const supabase = createServerClient() as any;

  const { data: link } = await supabase
    .from('share_links')
    .select('id, slug, label, title, body_html, expires_at, created_at')
    .eq('slug', slug)
    .maybeSingle();

  if (!link) notFound();

  const typedLink = link as ShareLink;
  const expired = typedLink.expires_at ? new Date(typedLink.expires_at).getTime() < Date.now() : false;

  if (expired) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">このリンクは有効期限切れです</h1>
          <p className="text-sm text-gray-600">
            お手数ですが、共有元の担当者に新しいリンクの発行をご依頼ください。
          </p>
        </div>
      </main>
    );
  }

  // 写真一覧
  const { data: photoRows } = await supabase
    .from('photos')
    .select('id, filename, file_path, mime_type, size_bytes, sort_order')
    .eq('share_link_id', typedLink.id)
    .order('sort_order', { ascending: true });

  const photos = ((photoRows || []) as SharePhotoRow[]).map((p) => ({
    id: p.id,
    filename: p.filename,
    url: getSharePhotoUrl(supabase, p.file_path),
  }));

  // 通常LP用のメニュー一覧（/p/[slug] と同じ取り方）
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

  return (
    <HomeContent
      menuItems={menuItems}
      shareData={{
        link: {
          slug: typedLink.slug,
          label: typedLink.label,
          title: typedLink.title,
          body_html: typedLink.body_html,
        },
        photos,
      }}
    />
  );
}

export const dynamic = 'force-dynamic';
