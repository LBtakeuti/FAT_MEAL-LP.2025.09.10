'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * F14-1: Markdown 本文をレンダリングするクライアントコンポーネント。
 * react-markdown + remark-gfm。タイポグラフィは prose 風にカスタムクラスで揃える。
 */
export default function ArticleContent({ content }: { content: string }) {
  return (
    <div className="article-body text-gray-800 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-10 mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-10 mb-3 pb-2 border-b border-orange-200">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-8 mb-3">{children}</h3>
          ),
          p: ({ children }) => <p className="my-4 leading-[1.9]">{children}</p>,
          ul: ({ children }) => <ul className="my-4 list-disc pl-6 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal pl-6 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-[1.8]">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-orange-600 underline hover:text-orange-700"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-4 border-orange-300 text-gray-700 italic">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return <code className="bg-gray-100 text-pink-700 px-1.5 py-0.5 rounded text-sm">{children}</code>;
            }
            return (
              <code className={`${className ?? ''} block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed`}>
                {children}
              </code>
            );
          },
          img: ({ src, alt }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={typeof src === 'string' ? src : ''}
              alt={alt ?? ''}
              loading="lazy"
              className="my-6 rounded-lg w-full h-auto"
            />
          ),
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left font-bold">{children}</th>
          ),
          td: ({ children }) => <td className="border border-gray-300 px-3 py-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
