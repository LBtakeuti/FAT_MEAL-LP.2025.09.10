import type { Metadata } from "next";
import "./globals.css";
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased bg-[#fff7ed] min-h-screen">
        {/* ヘッダーをlayoutに配置してページ遷移時のレイアウトシフトを防止 */}
        <div className="sm:hidden">
          <MobileHeader />
        </div>
        <div className="hidden sm:block">
          <Header />
        </div>
        {children}
      </body>
    </html>
  );
}
