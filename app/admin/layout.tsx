'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ログインページの場合はレイアウトを表示しない
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin', label: 'ダッシュボード' },
    { href: '/admin/analytics', label: 'アナリティクス' },
    { href: '/admin/orders', label: '注文管理' },
    { href: '/admin/subscriptions', label: 'サブスクリプション' },
    { href: '/admin/referrers', label: '紹介者管理' },
    { href: '/admin/menu', label: '弁当管理' },
    { href: '/admin/news', label: 'ニュース管理' },
    { href: '/admin/contacts', label: 'お問い合わせ管理' },
    { href: '/admin/inventory', label: '在庫管理' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* サイドバー */}
      <aside className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 ${
        isSidebarOpen ? 'w-64' : 'w-16'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-xl font-bold ${!isSidebarOpen && 'hidden'}`}>
              管理画面
            </h1>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white hover:bg-gray-800 p-2 rounded"
            >
              {isSidebarOpen ? '<' : '>'}
            </button>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800 transition-colors ${
                  pathname === item.href ? 'bg-gray-800' : ''
                }`}
              >
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-800 transition-colors w-full text-left"
          >
            {isSidebarOpen && <span>ログアウト</span>}
          </button>
        </div>
      </aside>
      
      {/* メインコンテンツ */}
      <main className={`transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-16'
      }`}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}