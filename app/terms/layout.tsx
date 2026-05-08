import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '利用規約 | ふとるめし',
  robots: { index: false, follow: true },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
