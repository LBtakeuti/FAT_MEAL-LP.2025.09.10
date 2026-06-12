import type { Metadata } from 'next';
import { getMenuItemsServer } from '@/lib/supabase';
import MenuListContent from '@/components/pages/MenuListContent';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';
import type { MenuItem } from '@/types';

export const revalidate = 60; // 60秒でキャッシュを再検証

// SEO-S3: メニュー一覧の固有メタ情報。
export const metadata: Metadata = {
  title: 'メニュー一覧 | ふとるめし',
  description:
    'ふとるめしの高カロリー・高タンパク冷凍弁当のメニュー一覧。各メニューのカロリー・タンパク質・脂質・炭水化物を掲載しています。',
  alternates: { canonical: `${SITE_URL}/menu-list` },
  openGraph: {
    type: 'website',
    title: 'メニュー一覧 | ふとるめし',
    description:
      'ふとるめしの高カロリー・高タンパク冷凍弁当のメニュー一覧。各メニューの栄養成分を掲載しています。',
    url: `${SITE_URL}/menu-list`,
    siteName: 'ふとるめし',
    locale: 'ja_JP',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'メニュー一覧 | ふとるめし',
    description: 'ふとるめしの高カロリー・高タンパク冷凍弁当のメニュー一覧。',
  },
};

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
            fetchPriority={index < 5 ? 'high' : 'auto'}
          />
        )
      ))}
    </>
  );
}

export default async function MenuListPage() {
  // サーバーサイドで全メニューデータを取得
  const menuItemsDB = await getMenuItemsServer();

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
    weight: String(item.weight ?? ''),
    image: item.main_image || '',
    features: [],
    ingredients: item.ingredients || [],
    allergens: item.allergens || [],
  }));

  // 最初の10枚の画像URLを抽出（ファーストビュー分）
  const imageUrls = menuItems.slice(0, 10).map(item => item.image).filter(Boolean);

  return (
    <>
      {/* 画像のプリロードリンク */}
      <ImagePreloadLinks images={imageUrls} />
      <MenuListContent menuItems={menuItems} />
    </>
  );
}
