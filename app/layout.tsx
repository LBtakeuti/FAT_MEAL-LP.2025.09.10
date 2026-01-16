import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: "ふとるめし - 高カロリー・高タンパクの冷凍弁当",
  description: "ふとるめしは、努力する人を応援し続けます。平均Cal900オーバー、タンパク質70gオーバー。脅威の弁当をご覧あれ。",
  metadataBase: new URL('https://www.futorumeshi.com'),
  icons: {
    icon: '/new-fabicon.png',
    apple: '/new-fabicon.png',
  },
  openGraph: {
    title: "ふとるめし - 高カロリー・高タンパクの冷凍弁当",
    description: "ふとるめしは、努力する人を応援し続けます。平均Cal900オーバー、タンパク質70gオーバー。脅威の弁当をご覧あれ。",
    url: 'https://www.futorumeshi.com',
    siteName: 'ふとるめし',
    images: [
      {
        url: '/new-fabicon.png',
        width: 1200,
        height: 630,
        alt: 'ふとるめし - 高カロリー・高タンパクの冷凍弁当',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ふとるめし - 高カロリー・高タンパクの冷凍弁当",
    description: "ふとるめしは、努力する人を応援し続けます。平均Cal900オーバー、タンパク質70gオーバー。脅威の弁当をご覧あれ。",
    images: ['/new-fabicon.png'],
  },
};

// ローディングフォールバックコンポーネント
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500">読み込み中...</p>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* Google Drive画像のDNS事前解決と接続事前確立 */}
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-[#fff7ed] min-h-screen flex flex-col">
        {/* ヘッダー - 常に固定表示 */}
        <div className="sm:hidden">
          <MobileHeader />
        </div>
        <div className="hidden sm:block">
          <Header />
        </div>

        {/* メインコンテンツ - ページ遷移時にここだけローディング */}
        <main className="flex-grow">
          <Suspense fallback={<PageLoadingFallback />}>
            {children}
          </Suspense>
        </main>

        {/* フッター - 常に固定表示 */}
        <Footer />
      </body>
    </html>
  );
}
