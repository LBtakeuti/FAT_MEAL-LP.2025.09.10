import Link from 'next/link';

// サーバーコンポーネント - 再レンダリングされない
export default function MobileHeaderLogo() {
  return (
    <Link href="/" className="h-14 flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/branding/logo-header.png"
        alt="ふとるめし"
        className="h-14 w-auto"
        style={{ display: 'block' }}
      />
    </Link>
  );
}
