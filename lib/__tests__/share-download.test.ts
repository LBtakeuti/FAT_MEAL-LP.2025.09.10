import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { shouldUseShareApi, downloadSelectedPhotosViaShare } from '../share-download';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('shouldUseShareApi', () => {
  it('SSR 環境（navigator が undefined）→ false', () => {
    vi.stubGlobal('navigator', undefined);
    expect(shouldUseShareApi()).toBe(false);
  });

  it('navigator.canShare が存在しない → false', () => {
    vi.stubGlobal('navigator', { share: vi.fn() });
    expect(shouldUseShareApi()).toBe(false);
  });

  it('navigator.share が存在しない → false', () => {
    vi.stubGlobal('navigator', { canShare: vi.fn().mockReturnValue(true) });
    expect(shouldUseShareApi()).toBe(false);
  });

  it('canShare({ files: [File] }) が true を返す → true', () => {
    vi.stubGlobal('navigator', {
      canShare: vi.fn().mockReturnValue(true),
      share: vi.fn(),
    });
    expect(shouldUseShareApi()).toBe(true);
  });

  it('canShare が例外を投げる → false', () => {
    vi.stubGlobal('navigator', {
      canShare: vi.fn().mockImplementation(() => { throw new Error('not supported'); }),
      share: vi.fn(),
    });
    expect(shouldUseShareApi()).toBe(false);
  });

  it('canShare が false を返す → false', () => {
    vi.stubGlobal('navigator', {
      canShare: vi.fn().mockReturnValue(false),
      share: vi.fn(),
    });
    expect(shouldUseShareApi()).toBe(false);
  });
});

describe('downloadSelectedPhotosViaShare - AbortError ハンドリング', () => {
  const slug = 'test-slug';
  const photos = [
    { id: 'p1', filename: 'photo1.jpg', url: 'https://example.com/photo1.jpg' },
  ];

  it('navigator.share が AbortError を throw → canceled === true', async () => {
    // fetch を成功させる
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['data'], { type: 'image/jpeg' })),
    }));
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new DOMException('User cancelled', 'AbortError')),
    });

    const result = await downloadSelectedPhotosViaShare(photos, slug);
    expect(result.canceled).toBe(true);
    expect(result.sharedCount).toBe(0);
  });

  it('navigator.share が AbortError 以外を throw → 例外が伝播', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['data'], { type: 'image/jpeg' })),
    }));
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new Error('network error')),
    });

    await expect(downloadSelectedPhotosViaShare(photos, slug)).rejects.toThrow('network error');
  });
});

describe('downloadSelectedPhotosViaShare - fetch タイムアウト（F12）', () => {
  const slug = 'test-slug';
  const photos = [
    { id: 'p1', filename: 'photo1.jpg', url: 'https://example.com/photo1.jpg' },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('fetch が 10秒でタイムアウト → failedFilenames に積まれ navigator.share は呼ばれない', async () => {
    // signal を受け取り、abort イベントで reject する fetch モック
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, opts?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        opts?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
        // 11秒後に resolve するが、10秒でタイムアウトするため到達しない
        setTimeout(() => _resolve({ ok: true, blob: () => Promise.resolve(new Blob()) }), 11_000);
      });
    }));
    const shareMock = vi.fn();
    vi.stubGlobal('navigator', { share: shareMock });

    const promise = downloadSelectedPhotosViaShare(photos, slug);
    // 10秒経過させてタイムアウトを発火
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await promise;

    expect(result.failedFilenames).toContain('photo1.jpg');
    expect(result.sharedCount).toBe(0);
    expect(result.canceled).toBe(false);
    expect(shareMock).not.toHaveBeenCalled();
  });

  it('fetch が 10秒以内に成功 → navigator.share が呼ばれる', async () => {
    // 5秒で resolve する fetch モック
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['data'], { type: 'image/jpeg' })),
        }), 5_000);
      });
    }));
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share: shareMock });

    const promise = downloadSelectedPhotosViaShare(photos, slug);
    // 5秒経過で fetch が resolve
    await vi.advanceTimersByTimeAsync(5_000);
    await promise;

    expect(shareMock).toHaveBeenCalledOnce();
  });

  it('fetch 成功時も clearTimeout が呼ばれる（タイマーリーク防止）', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['data'], { type: 'image/jpeg' })),
        }), 1_000);
      });
    }));
    vi.stubGlobal('navigator', { share: vi.fn().mockResolvedValue(undefined) });

    const promise = downloadSelectedPhotosViaShare(photos, slug);
    await vi.advanceTimersByTimeAsync(1_000);
    await promise;

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
