import { notFound } from 'next/navigation';
import MenuDetailClient from '@/components/MenuDetailClient';
import { getMenuItemById, menuItems } from '@/data/menuData';

// 静的パラメータを生成（ビルド時に全メニューページを事前生成）
export function generateStaticParams() {
  return menuItems.map((item) => ({
    id: item.id,
  }));
}

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ローカルデータから取得（シンプル）
  const menuItem = getMenuItemById(id);

  if (!menuItem) {
    notFound();
  }

  // MenuDetailClientに渡す形式に変換
  const formattedMenuItem = {
    ...menuItem,
    images: [menuItem.image],
    price: String(menuItem.price),
    calories: String(menuItem.calories),
    protein: String(menuItem.protein),
    fat: String(menuItem.fat),
    carbs: String(menuItem.carbs),
  };

  return <MenuDetailClient menuItem={formattedMenuItem} />;
}
