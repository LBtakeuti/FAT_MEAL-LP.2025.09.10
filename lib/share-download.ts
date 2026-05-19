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
