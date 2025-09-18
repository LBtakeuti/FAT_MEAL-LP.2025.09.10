import { getMenuItemById, menuItems } from '@/data/menuData';
import { notFound } from 'next/navigation';
import MenuDetailClient from '@/components/MenuDetailClient';

export async function generateStaticParams() {
  return menuItems.map((item) => ({
    id: item.id,
  }));
}

export default function MenuDetailPage({ params }: { params: { id: string } }) {
  const menuItem = getMenuItemById(params.id);

  if (!menuItem) {
    notFound();
  }

  return <MenuDetailClient menuItem={menuItem} />;
}