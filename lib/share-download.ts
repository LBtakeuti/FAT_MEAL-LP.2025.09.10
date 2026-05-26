import { saveAs } from 'file-saver';

export interface SharePhotoLike {
  id: string;
  filename: string;
  url: string;
}

export type DownloadType = 'single' | 'zip';

interface LogPayload {
  photo_id?: string;
  download_type: DownloadType;
}

/** サーバーへ DL ログを送る（失敗時は黙って続行） */
export async function logShareDownload(slug: string, payload: LogPayload): Promise<void> {
  try {
    await fetch(`/api/share-links/${slug}/log-download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error('log-download failed', e);
  }
}

/** 写真1枚をダウンロード。成功後にログ送信し、成否を返す */
export async function downloadSinglePhoto(photo: SharePhotoLike, slug: string): Promise<boolean> {
  try {
    const res = await fetch(photo.url);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const blob = await res.blob();
    saveAs(blob, photo.filename);
    await logShareDownload(slug, { photo_id: photo.id, download_type: 'single' });
    return true;
  } catch (e) {
    console.error('single download failed', e);
    return false;
  }
}

const SEQUENTIAL_DOWNLOAD_INTERVAL_MS = 350;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SequentialDownloadProgress {
  current: number; // 1-indexed
  total: number;
  filename: string;
}

export interface SequentialDownloadResult {
  successCount: number;
  failedFilenames: string[];
}

/**
 * 選択された写真を順次1枚ずつダウンロード。
 * iOS Safari の連続downloadブロック緩和のため各DLの間に 350ms 待機。
 */
export async function downloadSelectedPhotos(
  photos: SharePhotoLike[],
  slug: string,
  onProgress?: (progress: SequentialDownloadProgress) => void
): Promise<SequentialDownloadResult> {
  const failed: string[] = [];
  let success = 0;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    onProgress?.({ current: i + 1, total: photos.length, filename: photo.filename });
    const ok = await downloadSinglePhoto(photo, slug);
    if (ok) {
      success += 1;
    } else {
      failed.push(photo.filename);
    }
    if (i < photos.length - 1) {
      await sleep(SEQUENTIAL_DOWNLOAD_INTERVAL_MS);
    }
  }

  return { successCount: success, failedFilenames: failed };
}

// 拡張子から MIME type を推定（Blob.type が空の場合のフォールバック）
function guessMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * Web Share API（files つき）が現在の環境で利用可能か判定。
 * モバイル（iOS Safari / Android Chrome）の判定にも使う。
 *
 * navigator.canShare に File 配列を渡して true が返ればサポート確定。
 * 一部の Android Chrome で誤った値を返す可能性は許容（フォールバックは既存ロジック）。
 */
export function shouldUseShareApi(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (typeof navigator.canShare !== 'function') return false;
  if (typeof navigator.share !== 'function') return false;
  try {
    const probe = new File([new Uint8Array(1)], 'probe.png', { type: 'image/png' });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export interface ShareDownloadResult {
  /** 共有シートにファイルを渡せた枚数 */
  sharedCount: number;
  /** fetch / File 変換に失敗したファイル名 */
  failedFilenames: string[];
  /** ユーザーが共有シートをキャンセルした場合 true */
  canceled: boolean;
}

/**
 * 選択された写真を Web Share API 経由で一括共有する（モバイル向け）。
 * iOS Safari の「1ジェスチャー = 1ダウンロード」制約を回避し、
 * 共有シートから写真アプリに保存できるようにする。
 *
 * - 全画像を fetch → Blob → File に変換し、一括で navigator.share() に渡す
 * - 1枚でも fetch / File 変換に失敗したものは failedFilenames に残し、残りは共有を試みる
 * - ユーザーが共有シートをキャンセルした場合は canceled=true、エラー表示は呼び出し側で抑制すること
 */
export async function downloadSelectedPhotosViaShare(
  photos: SharePhotoLike[],
  slug: string,
  onProgress?: (progress: SequentialDownloadProgress) => void
): Promise<ShareDownloadResult> {
  const failed: string[] = [];
  const files: File[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    onProgress?.({ current: i + 1, total: photos.length, filename: photo.filename });
    try {
      const res = await fetch(photo.url);
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const blob = await res.blob();
      const type = blob.type || guessMimeType(photo.filename);
      files.push(new File([blob], photo.filename, { type }));
    } catch (e) {
      console.error('share fetch/convert failed', e);
      failed.push(photo.filename);
    }
  }

  if (files.length === 0) {
    return { sharedCount: 0, failedFilenames: failed, canceled: false };
  }

  try {
    await navigator.share({
      files,
      title: 'ふとるめし',
      text: '写真を保存できます',
    });
  } catch (e) {
    // ユーザーキャンセルは AbortError として通知される。これは沈黙させる。
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { sharedCount: 0, failedFilenames: failed, canceled: true };
    }
    throw e;
  }

  // 共有成功時はログを送信（1枚ずつ、photo_id がわかる単位で）
  for (const photo of photos) {
    if (failed.includes(photo.filename)) continue;
    logShareDownload(slug, { photo_id: photo.id, download_type: 'single' });
  }

  return { sharedCount: files.length, failedFilenames: failed, canceled: false };
}
