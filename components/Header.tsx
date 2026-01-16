import Link from 'next/link';
import HeaderLogo from './HeaderLogo';
import HeaderNav from './HeaderNav';

// サーバーコンポーネント - ロゴは再レンダリングされない
const Header: React.FC = () => {
  return (
    <header className="relative bg-white shadow-md hidden sm:block">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col items-center">
          {/* ロゴ - サーバーコンポーネント（再レンダリングされない） */}
          <HeaderLogo />

          {/* ナビゲーション - クライアントコンポーネント */}
          <HeaderNav />
        </div>
      </div>
    </header>
  );
};

export default Header;
