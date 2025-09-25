import { notFound } from 'next/navigation';
import MenuDetailClient from '@/components/MenuDetailClient';
import { getDbAdapter } from '@/lib/db-adapter';

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // データベースから直接取得
  const db = getDbAdapter();
  const menuItem = await db.getMenuItem(id);

  if (!menuItem) {
    notFound();
  }

  // MenuItemDBからMenuItem形式に変換
  const formattedMenuItem = {
    ...menuItem,
    image: menuItem.images?.[0] || '/placeholder-image.jpg', // 最初の画像をimageに設定
    ingredients: typeof menuItem.ingredients === 'string' 
      ? menuItem.ingredients.split(',').map((i: string) => i.trim())
      : menuItem.ingredients
  };

  return <MenuDetailClient menuItem={formattedMenuItem} />;
}