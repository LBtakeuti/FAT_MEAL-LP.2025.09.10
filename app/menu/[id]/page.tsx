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

  // main_imageとsub_imagesから画像配列を作成
  const allImages: string[] = [];
  if ((menuItem as any).main_image) {
    allImages.push((menuItem as any).main_image);
  }
  if ((menuItem as any).sub_images && Array.isArray((menuItem as any).sub_images)) {
    allImages.push(...(menuItem as any).sub_images);
  }
  // 旧形式のimagesカラムにも対応
  if (menuItem.images && Array.isArray(menuItem.images) && menuItem.images.length > 0) {
    allImages.push(...menuItem.images);
  }

  // MenuDetailClientに渡す形式に変換
  const formattedMenuItem = {
    id: menuItem.id,
    name: menuItem.name,
    description: menuItem.description,
    image: allImages[0] || '/placeholder-menu.jpg',
    images: allImages.length > 0 ? allImages : [],
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
