import { describe, it, expect, vi, afterEach } from 'vitest';
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
