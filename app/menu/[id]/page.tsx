import { notFound } from 'next/navigation';
import MenuDetailClient from '@/components/MenuDetailClient';

async function getMenuItem(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3007'}/api/menu/${id}`, {
      cache: 'no-store' // 常に最新データを取得
    });
    
    if (!res.ok) {
      return null;
    }
    
    return res.json();
  } catch (error) {
    console.error('Failed to fetch menu item:', error);
    return null;
  }
}

export default async function MenuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const menuItem = await getMenuItem(id);

  if (!menuItem) {
    notFound();
  }

  return <MenuDetailClient menuItem={menuItem} />;
}