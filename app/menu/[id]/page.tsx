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

  return <MenuDetailClient menuItem={menuItem} />;
}