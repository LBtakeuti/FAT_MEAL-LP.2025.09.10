import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "ふとるめし - 高カロリー・高タンパクの冷凍弁当",
  description: "ふとるめしは、努力する人を応援し続けます。平均Cal900オーバー、タンパク質70gオーバー。脅威の弁当をご覧あれ。",
  metadataBase: new URL('https://www.futorumeshi.com'),
  icons: {
    icon: '/logo-favicon.png',
    apple: '/logo-favicon.png',
  },
  openGraph: {
    title: "ふとるめし - 高カロリー・高タンパクの冷凍弁当",
    description: "ふとるめしは、努力する人を応援し続けます。平均Cal900オーバー、タンパク質70gオーバー。脅威の弁当をご覧あれ。",
    url: 'https://www.futorumeshi.com',
    siteName: 'ふとるめし',
    images: [
      {
        url: '/logo-favicon.png',
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
    images: ['/logo-favicon.png'],
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
