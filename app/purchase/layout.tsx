import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ご購入手続き | ふとるめし',
  robots: { index: false, follow: true },
};

export default function PurchaseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
