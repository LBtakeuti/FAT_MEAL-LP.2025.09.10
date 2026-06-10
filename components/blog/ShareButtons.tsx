'use client';

import { useState } from 'react';

/**
 * F50-1: 記事用シェアボタン（X / LINE / URLコピー）
 * 記事本文の上下に配置する想定。
 */
interface ShareButtonsProps {
  url: string;
  title: string;
  // 配置位置でラベルを変えたい場合に使用（任意）
  label?: string;
}

export default function ShareButtons({ url, title, label = 'この記事をシェア' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(title);

  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const lineShareUrl = `https://line.me/R/msg/text/?${encodedText}%20${encodedUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[ShareButtons] copy failed', err);
    }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs sm:text-sm text-gray-600">{label}</span>
      {/* X (Twitter) */}
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Xでシェア"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
      {/* LINE */}
      <a
        href={lineShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="LINEでシェア"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-green-500 bg-white text-green-600 hover:bg-green-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.365 9.89c.41 0 .746.337.746.747a.748.748 0 0 1-.746.748h-2.18v1.394h2.18c.41 0 .746.336.746.749a.745.745 0 0 1-.746.745h-2.926a.748.748 0 0 1-.744-.745V7.84c0-.41.336-.747.749-.747h2.921c.41 0 .746.336.746.747a.748.748 0 0 1-.746.748h-2.18V9.89zm-3.305 3.388a.747.747 0 0 1-.748.745.736.736 0 0 1-.603-.3l-2.992-4.066v3.621a.745.745 0 0 1-.746.745.747.747 0 0 1-.748-.745V7.84a.746.746 0 0 1 .744-.747c.232 0 .459.123.598.3l2.999 4.077V7.84c0-.41.336-.747.747-.747.41 0 .749.336.749.747zm-7.482 0a.747.747 0 0 1-.748.745.745.745 0 0 1-.746-.745V7.84a.746.746 0 0 1 .746-.747c.41 0 .748.336.748.747zm-2.752.745H2.901a.748.748 0 0 1-.747-.745V7.84a.747.747 0 1 1 1.494 0v4.04h2.179a.747.747 0 0 1 0 1.494M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      </a>
      {/* URLコピー */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="URLをコピー"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>

      {/* コピー完了トースト */}
      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-20 z-50 flex justify-center pointer-events-none px-4"
        >
          <div className="pointer-events-auto bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2 rounded-lg shadow-lg">
            URLをコピーしました
          </div>
        </div>
      )}
    </div>
  );
}
