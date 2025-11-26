import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "ふとるめし - 高カロリー・高栄養の冷凍宅食サービス",
  description: "食べたいのに食べられない方のための高カロリー宅食サービス。管理栄養士監修で1食600kcal以上。体重増加をサポートします。",
  icons: {
    icon: '/fat_logo1.png',
    apple: '/fat_logo1.png',
  },
  openGraph: {
    title: "ふとるめし - 高カロリー・高栄養の冷凍宅食サービス",
    description: "食べたいのに食べられない方のための高カロリー宅食サービス。管理栄養士監修で1食600kcal以上。体重増加をサポートします。",
    images: [
      {
        url: '/fat_logo1.png',
        width: 1200,
        height: 630,
        alt: 'ふとるめし',
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "ふとるめし - 高カロリー・高栄養の冷凍宅食サービス",
    description: "食べたいのに食べられない方のための高カロリー宅食サービス。管理栄養士監修で1食600kcal以上。体重増加をサポートします。",
    images: ['/fat_logo1.png'],
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
        {children}
      </body>
    </html>
  );
}
