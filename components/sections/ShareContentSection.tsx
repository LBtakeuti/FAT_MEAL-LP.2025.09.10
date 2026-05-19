'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  downloadSelectedPhotos,
  type SharePhotoLike,
  type SequentialDownloadProgress,
} from '@/lib/share-download';
import { ShareCarousel } from '@/components/share/ShareCarousel';
import { MessageBlock } from '@/components/share/MessageBlock';

interface ShareLinkLike {
  slug: string;
  label: string | null;
  title: string | null;
  body_html: string;
}

interface Props {
  link: ShareLinkLike;
  photos: SharePhotoLike[];
}

interface Notice {
  type: 'error' | 'success' | 'info';
  message: string;
}

/**
 * 通常LPのヒーロー直下に差し込まれるセクション。
 * 写真カルーセル + 選択ダウンロード + メッセージ表示を担う。
 */
export function ShareContentSection({ link, photos }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<SequentialDownloadProgress | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const accessLoggedRef = useRef(false);

  // ページ着地時に1回だけアクセスログを送る + 購入アトリビューション用に
  // share_slug を sessionStorage に保存（PurchaseFlow が決済時に拾って Stripe metadata に伝搬）
  useEffect(() => {
    if (accessLoggedRef.current) return;
    accessLoggedRef.current = true;
    fetch(`/api/share-links/${link.slug}/log-access`, { method: 'POST' }).catch(() => {});
    try {
      sessionStorage.setItem('share_slug', link.slug);
    } catch {
      // SSR / プライベートモード等で失敗してもアトリビューションのみ落ちるだけで他は動く
    }
  }, [link.slug]);

  useEffect(() => {
    if (!notice || downloading) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice, downloading]);

  const toggle = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  }, [photos]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectedPhotos = useMemo(
    () => photos.filter((p) => selectedIds.has(p.id)),
    [photos, selectedIds]
  );

  const handleDownload = useCallback(async () => {
    if (selectedPhotos.length === 0) return;
    setDownloading(true);
    setNotice({ type: 'info', message: `ダウンロード中... (0/${selectedPhotos.length})` });
    const result = await downloadSelectedPhotos(selectedPhotos, link.slug, (p) => {
      setProgress(p);
      setNotice({ type: 'info', message: `ダウンロード中... (${p.current}/${p.total}) ${p.filename}` });
    });
    setDownloading(false);
    setProgress(null);

    if (result.failedFilenames.length === 0) {
      setNotice({ type: 'success', message: `${result.successCount}枚をダウンロードしました` });
    } else if (result.successCount > 0) {
      setNotice({
        type: 'error',
        message: `${result.successCount}枚成功 / ${result.failedFilenames.length}枚失敗: ${result.failedFilenames.join(', ')}`,
      });
    } else {
      setNotice({ type: 'error', message: 'ダウンロードに失敗しました。時間を空けて再度お試しください' });
    }
  }, [selectedPhotos, link.slug]);

  const hasPhotos = photos.length > 0;
  const hasMessage = !!link.title || !!link.body_html;

  if (!hasPhotos && !hasMessage) return null;

  return (
    <section className="bg-[#F9F8F3] py-8 sm:py-12" id="share">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        {hasPhotos && (
          <div className="space-y-4">
            <ShareCarousel
              photos={photos}
              selectedIds={selectedIds}
              onToggle={toggle}
            />

            <div className="flex items-center justify-between gap-2 text-sm">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  disabled={downloading || selectedIds.size === photos.length}
                  className="text-orange-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  全選択
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={downloading || selectedIds.size === 0}
                  className="text-gray-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  解除
                </button>
              </div>
              <span className="text-gray-500 tabular-nums">{selectedIds.size} / {photos.length} 枚選択</span>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || selectedIds.size === 0}
              className="w-full bg-orange-600 text-white py-3 rounded-md hover:bg-orange-700 disabled:bg-gray-300 transition-colors font-medium"
            >
              {downloading
                ? progress
                  ? `ダウンロード中... (${progress.current}/${progress.total})`
                  : 'ダウンロード中...'
                : selectedIds.size === 0
                  ? '写真を選択してください'
                  : `ダウンロード (${selectedIds.size}枚)`}
            </button>
          </div>
        )}

        {hasMessage && (
          <MessageBlock title={link.title} bodyHtml={link.body_html} />
        )}

        {notice && (
          <div
            className={`fixed bottom-4 left-1/2 -translate-x-1/2 max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-lg shadow-lg text-sm z-50 ${
              notice.type === 'error'
                ? 'bg-red-600 text-white'
                : notice.type === 'success'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-900 text-white'
            }`}
            role="status"
          >
            {notice.message}
          </div>
        )}
      </div>
    </section>
  );
}
