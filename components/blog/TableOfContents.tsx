import type { TocItem } from '@/lib/blog-toc';

/**
 * F50-2: 目次（Table of Contents）コンポーネント。
 * 見出しが3個以上ある場合のみ表示。
 * リンクは `#toc-N` 形式（ArticleContent.tsx の h2/h3 id と一致）。
 */
export default function TableOfContents({ items }: { items: TocItem[] }) {
  if (!items || items.length < 3) return null;

  return (
    <nav
      aria-label="もくじ"
      className="mb-8 rounded-md border border-orange-200 bg-orange-50/40 px-5 py-4"
    >
      <p className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        もくじ
      </p>
      <ol className="space-y-1.5 text-sm">
        {items.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? 'pl-5 list-disc list-inside' : 'list-decimal list-inside'}
          >
            <a
              href={`#${item.id}`}
              className="text-gray-800 hover:text-orange-600 hover:underline"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
