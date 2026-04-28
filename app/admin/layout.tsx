'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

// --- Inline SVG Icons (20x20, no external dependency) ---
function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="8" rx="1" />
      <rect x="11" y="2" width="7" height="5" rx="1" />
      <rect x="2" y="12" width="7" height="6" rx="1" />
      <rect x="11" y="9" width="7" height="9" rx="1" />
    </svg>
  );
}
function IconAnalytics() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,16 6,10 10,13 14,6 18,9" />
      <line x1="2" y1="18" x2="18" y2="18" />
    </svg>
  );
}
function IconSurvey() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="14" height="16" rx="2" />
      <line x1="7" y1="6" x2="13" y2="6" />
      <line x1="7" y1="10" x2="13" y2="10" />
      <line x1="7" y1="14" x2="10" y2="14" />
    </svg>
  );
}
function IconOrders() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="15" cy="17" r="1.5" />
      <path d="M1,1 h3 l2,10 h10 l2,-7 H6" />
    </svg>
  );
}
function IconDelivery() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="11" height="8" rx="1" />
      <path d="M12,9 h4 l3,4 v1 h-7" />
      <circle cx="5" cy="16" r="2" />
      <circle cx="15" cy="16" r="2" />
    </svg>
  );
}
function IconInventory() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <path d="M2,4 L10,1 L18,4" />
      <line x1="7" y1="9" x2="13" y2="9" />
    </svg>
  );
}
function IconTiktok() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10,2 v12 a4,4 0 1,1-3,-3" />
      <path d="M10,2 c0,0 2,0 4,2 c2,2 4,1 4,1" />
    </svg>
  );
}
function IconBento() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <line x1="10" y1="4" x2="10" y2="16" />
      <line x1="2" y1="10" x2="10" y2="10" />
    </svg>
  );
}
function IconNews() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="14" rx="2" />
      <line x1="5" y1="7" x2="10" y2="7" />
      <line x1="5" y1="10" x2="15" y2="10" />
      <line x1="5" y1="13" x2="15" y2="13" />
      <rect x="12" y="6" width="3" height="3" />
    </svg>
  );
}
function IconBanner() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <circle cx="7" cy="9" r="2" />
      <path d="M2,14 l5,-4 l3,3 l3,-2 l5,3" />
    </svg>
  );
}
function IconMedia() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="16" height="10" rx="2" />
      <polygon points="8,8 8,12 13,10" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconCustomers() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="3" />
      <circle cx="15" cy="8" r="2" />
      <path d="M1,18 c0,-4 3,-7 6,-7 s6,3 6,7" />
      <path d="M13,18 c0,-3 1.5,-4.5 3,-4.5 s2.5,1.5 2.5,4.5" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3" />
      <path d="M3,18 c0,-4 3,-7 7,-7 s7,3 7,7" />
    </svg>
  );
}
function IconReferrers() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="3" />
      <circle cx="14" cy="7" r="2.5" />
      <path d="M1,17 c0,-4 4,-6 6,-6 s6,2 6,6" />
      <path d="M12,17 c0,-3 2,-5 4,-5 s3,2 3,5" />
    </svg>
  );
}
function IconAmbassador() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="7" r="3" />
      <path d="M3,18 c0,-4 3,-7 7,-7 s7,3 7,7" />
      <path d="M10,1 l1,2 h2 l-1.5,1.5 .5,2 L10,5.5 8,6.5 l.5,-2 L7,3 h2 z" />
    </svg>
  );
}
function IconFeedback() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2,3 h16 v11 h-10 l-4,3 v-3 h-2 z" />
      <line x1="6" y1="7" x2="14" y2="7" />
      <line x1="6" y1="10" x2="11" y2="10" />
    </svg>
  );
}
function IconContact() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <polyline points="2,4 10,11 18,4" />
    </svg>
  );
}
function IconMessage() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4,3 h12 a2,2 0 0,1 2,2 v8 a2,2 0 0,1-2,2 h-3 l-3,3 -3,-3 h-3 a2,2 0 0,1-2,-2 v-8 a2,2 0 0,1 2,-2 z" />
      <circle cx="7" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function IconLogout() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7,3 H4 a2,2 0 0,0-2,2 v10 a2,2 0 0,0 2,2 h3" />
      <polyline points="12,6 18,10 12,14" />
      <line x1="18" y1="10" x2="7" y2="10" />
    </svg>
  );
}
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="5,2 10,7 5,12" />
    </svg>
  );
}

// --- Menu Groups ---
type MenuItemDef = {
  href: string;
  label: string;
  icon: React.ComponentType;
  exact?: boolean;
};

type MenuGroup = {
  key: string;
  label: string;
  items: MenuItemDef[];
};

const menuGroups: MenuGroup[] = [
  {
    key: 'overview',
    label: '概要',
    items: [
      { href: '/admin/analytics', label: 'アナリティクス', icon: IconAnalytics },
      { href: '/admin/surveys', label: 'アンケート集計', icon: IconSurvey },
    ],
  },
  {
    key: 'orders',
    label: '注文・配送',
    items: [
      { href: '/admin/orders', label: '注文管理', icon: IconOrders },
      { href: '/admin/delivery', label: '配送管理', icon: IconDelivery },
      { href: '/admin/inventory', label: '在庫管理', icon: IconInventory },
      { href: '/admin/tiktok-shop', label: 'TikTok Shop', icon: IconTiktok },
    ],
  },
  {
    key: 'products',
    label: '商品・コンテンツ',
    items: [
      { href: '/admin/menu', label: '弁当管理', icon: IconBento },
      { href: '/admin/news', label: 'ニュース管理', icon: IconNews },
      { href: '/admin/banner', label: 'バナー管理', icon: IconBanner },
      { href: '/admin/media-logos', label: 'メディアロゴ管理', icon: IconMedia },
    ],
  },
  {
    key: 'people',
    label: '顧客・連携',
    items: [
      { href: '/admin/customers', label: '顧客管理', icon: IconCustomers },
      { href: '/admin/users', label: 'ユーザー管理', icon: IconUsers },
      { href: '/admin/referrers', label: '紹介者管理', icon: IconReferrers },
      { href: '/admin/ambassadors', label: 'アンバサダー管理', icon: IconAmbassador },
      { href: '/admin/feedbacks', label: 'お客様の声管理', icon: IconFeedback },
      { href: '/admin/contacts', label: 'お問い合わせ管理', icon: IconContact },
      { href: '/admin/promoter-pages', label: '個別メッセージ', icon: IconMessage },
    ],
  },
];

// --- Layout ---
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // 現在のパスに該当するグループを自動展開
  const getInitialOpenGroups = () => {
    const groups: Record<string, boolean> = {
      overview: false,
      orders: false,
      products: false,
      people: false,
    };
    for (const group of menuGroups) {
      if (group.items.some((item) => pathname.startsWith(item.href))) {
        groups[group.key] = true;
      }
    }
    return groups;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(getInitialOpenGroups);

  // ページ遷移時に該当グループを自動展開
  useEffect(() => {
    for (const group of menuGroups) {
      if (group.items.some((item) => pathname.startsWith(item.href))) {
        setOpenGroups((prev) => ({ ...prev, [group.key]: true }));
      }
    }
  }, [pathname]);

  // ログインページの場合はレイアウトを表示しない
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const isActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* サイドバー */}
      <aside
        className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
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
        </div>

        <nav className="flex-1 overflow-y-auto px-2 space-y-1">
          {menuGroups.map((group) => (
            <div key={group.key}>
              {/* グループヘッダー（サイドバー展開時のみ表示） */}
              {isSidebarOpen && (
                <div
                  onClick={() => toggleGroup(group.key)}
                  role="button"
                  className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-200"
                >
                  <span>{group.label}</span>
                  <IconChevron open={openGroups[group.key]} />
                </div>
              )}

              {/* グループ内アイテム */}
              {(isSidebarOpen ? openGroups[group.key] : true) &&
                group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!isSidebarOpen ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded transition-colors relative ${
                        active
                          ? 'bg-orange-600 text-white font-semibold'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      } ${!isSidebarOpen ? 'justify-center' : ''}`}
                    >
                      {active && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400 rounded-l" />
                      )}
                      <span className="flex-shrink-0">
                        <Icon />
                      </span>
                      {isSidebarOpen && <span>{item.label}</span>}
                    </Link>
                  );
                })}

              {/* グループ間のスペーサー（折りたたみ時） */}
              {!isSidebarOpen && <div className="my-2 border-t border-gray-700" />}
            </div>
          ))}
        </nav>

        <div className="flex-shrink-0 p-4">
          <button
            onClick={handleLogout}
            title={!isSidebarOpen ? 'ログアウト' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 transition-colors w-full text-left text-gray-300 hover:text-white ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <span className="flex-shrink-0">
              <IconLogout />
            </span>
            {isSidebarOpen && <span>ログアウト</span>}
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'ml-64' : 'ml-16'
        }`}
      >
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
