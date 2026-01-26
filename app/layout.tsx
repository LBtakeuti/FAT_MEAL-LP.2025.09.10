import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import LayoutContent from '@/components/LayoutContent';

// GA4 Measurement ID from environment variable
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "ふとるめし - 高カロリー・高タンパクの冷凍弁当",
  description: "ふとるめしは、努力する人を応援し続けます。平均Cal500オーバー、タンパク質30gオーバー。脅威の弁当をご覧あれ。",
  metadataBase: new URL('https://www.futorumeshi.com'),
  icons: {
    icon: '/new-fabicon.png',
    apple: '/new-fabicon.png',
  },
  openGraph: {
    title: "ふとるめし - 高カロリー・高タンパクの冷凍弁当",
    description: "ふとるめしは、努力する人を応援し続けます。平均Cal500オーバー、タンパク質30gオーバー。脅威の弁当をご覧あれ。",
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
    description: "ふとるめしは、努力する人を応援し続けます。平均Cal500オーバー、タンパク質30gオーバー。脅威の弁当をご覧あれ。",
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
      <head>
        {/* Google Drive画像のDNS事前解決と接続事前確立 */}
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased bg-[#fff7ed]">
        {/* Google Analytics 4 */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
