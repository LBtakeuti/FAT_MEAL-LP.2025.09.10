import { getMenuItemsServer, getFaqsServer } from '@/lib/supabase';
import HomeContent from '@/components/pages/HomeContent';
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
  // サーバーサイドでメニュー・FAQデータを取得（FAQはSEO-S1でSSR化）
  const [menuItemsDB, faqs] = await Promise.all([
    getMenuItemsServer(6),
    getFaqsServer(),
  ]);

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

  // 最初の6枚の画像URLを抽出
  const imageUrls = menuItems.slice(0, 6).map(item => item.image).filter(Boolean);

  // SEO-S1: FAQPage 構造化データ（JSON-LD）。各FAQを Question/acceptedAnswer に。
  // 回答は answer_title ＋ answer_detail を結合（検索リッチリザルト用の本文）。
  const faqJsonLd =
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: [f.answer_title, f.answer_detail].filter(Boolean).join('\n'),
            },
          })),
        }
      : null;
  // blog詳細と同じく < > & を Unicode エスケープして </script> インジェクションを防止。
  const safeFaqJsonLd = faqJsonLd
    ? JSON.stringify(faqJsonLd)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
    : null;

  return (
    <>
      {/* 画像のプリロードリンク */}
      <ImagePreloadLinks images={imageUrls} />
      {/* SEO-S1: FAQPage 構造化データ（XSS対策で < > & エスケープ済み） */}
      {safeFaqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeFaqJsonLd }}
        />
      )}
      <HomeContent menuItems={menuItems} initialFaqs={faqs} />
    </>
  );
}
