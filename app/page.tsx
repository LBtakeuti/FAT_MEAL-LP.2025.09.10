import { getMenuItemsServer } from '@/lib/supabase';
import HomeContent from '@/components/HomeContent';
import type { MenuItem } from '@/types';

export const revalidate = 60; // 60秒でキャッシュを再検証

// 画像プリロード用コンポーネント
function ImagePreloadLinks({ images }: { images: string[] }) {
  return (
    <>
      {images.map((src, index) => (
        src && (
          <link
            key={index}
            rel="preload"
            as="image"
            href={src}
            fetchPriority={index < 3 ? 'high' : 'auto'}
          />
        )
      ))}
    </>
  );
}

export default async function Home() {
  // サーバーサイドでメニューデータを取得
  const menuItemsDB = await getMenuItemsServer(6);

  // DBの型をMenuItem型に変換
  const menuItems: MenuItem[] = menuItemsDB.map((item) => ({
    id: item.slug || item.id,
    name: item.name,
    description: item.description || '',
    price: String(item.price || 0),
    calories: String(item.calories || 0),
    protein: String(item.protein || 0),
    fat: String(item.fat || 0),
    carbs: String(item.carbs || 0),
    image: item.main_image || '',
    features: [],
    ingredients: item.ingredients || [],
    allergens: item.allergens || [],
  }));

  // 最初の6枚の画像URLを抽出
  const imageUrls = menuItems.slice(0, 6).map(item => item.image).filter(Boolean);

  return (
    <>
      {/* 画像のプリロードリンク */}
      <ImagePreloadLinks images={imageUrls} />
      <HomeContent menuItems={menuItems} />
    </>
  );
}
