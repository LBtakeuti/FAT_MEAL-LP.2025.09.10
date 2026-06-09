import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新しいパスワードの設定 | ふとるめし',
  robots: { index: false, follow: true },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
