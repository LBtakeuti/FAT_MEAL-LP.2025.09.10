import { notFound } from 'next/navigation';
import MenuDetailClient from '@/components/MenuDetailClient';
import { db } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Supabaseからデータを取得
  const menuItem = await db.menu.getById(id);

  if (!menuItem) {
    notFound();
  }

  // MenuDetailClientに渡す形式に変換
  const formattedMenuItem = {
    id: menuItem.id,
    name: menuItem.name,
    description: menuItem.description,
    image: menuItem.images?.[0] || '/placeholder-menu.jpg',
    images: menuItem.images || [],
    price: String(menuItem.price),
    calories: String(menuItem.calories),
    protein: String(menuItem.protein),
    fat: String(menuItem.fat),
    carbs: String(menuItem.carbs),
    features: menuItem.features || [],
    ingredients: menuItem.ingredients || [],
    allergens: menuItem.allergens || [],
  };

  return <MenuDetailClient menuItem={formattedMenuItem} />;
}
