import Link from 'next/link';

// サーバーコンポーネント - 再レンダリングされない
export default function HeaderLogo() {
  return (
    <div className="mb-4 h-24 flex items-center justify-center">
      <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-header.png"
          alt="ふとるめし"
          className="h-24 w-auto"
          style={{ display: 'block' }}
        />
      </Link>
    </div>
  );
}
