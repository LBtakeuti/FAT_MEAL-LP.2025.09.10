import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'パスワード再設定 | ふとるめし',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
