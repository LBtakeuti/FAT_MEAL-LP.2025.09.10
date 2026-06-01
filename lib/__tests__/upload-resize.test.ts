import { describe, it, expect } from 'vitest';
import sharp from 'sharp';

// F17: upload/route.ts 内の maybeResize ロジックを再定義してテスト

const MAX_DIMENSION = 1200;
const RESIZE_HEIGHT = 630;
const SKIP_RESIZE_MIMES = new Set(['image/svg+xml', 'image/gif']);

async function maybeResize(
  inputBuffer: Buffer,
  mime: string,
): Promise<{ buffer: Buffer; resized: boolean }> {
  if (SKIP_RESIZE_MIMES.has(mime)) {
    return { buffer: inputBuffer, resized: false };
  }
  try {
    const image = sharp(inputBuffer);
    const meta = await image.metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width <= MAX_DIMENSION && height <= RESIZE_HEIGHT) {
      return { buffer: inputBuffer, resized: false };
    }
    const resized = await image
      .resize({
        width: MAX_DIMENSION,
        height: RESIZE_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toBuffer();
    return { buffer: resized, resized: true };
  } catch {
    return { buffer: inputBuffer, resized: false };
  }
}

async function createPng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 100, g: 100, b: 100 } },
  })
    .png()
    .toBuffer();
}

describe('maybeResize — MIME スキップ判定', () => {
  it('SVG は resized: false で元 buffer をそのまま返す', async () => {
    const buf = Buffer.from('<svg/>');
    const result = await maybeResize(buf, 'image/svg+xml');
    expect(result.resized).toBe(false);
    expect(result.buffer).toBe(buf);
  });

  it('GIF は resized: false で元 buffer をそのまま返す', async () => {
    const buf = Buffer.from('GIF89a');
    const result = await maybeResize(buf, 'image/gif');
    expect(result.resized).toBe(false);
    expect(result.buffer).toBe(buf);
  });
});

describe('maybeResize — リサイズ不要（閾値以内）', () => {
  it('1200x630 ちょうどは resized: false', async () => {
    const buf = await createPng(1200, 630);
    const result = await maybeResize(buf, 'image/png');
    expect(result.resized).toBe(false);
  });

  it('100x100 の小画像は resized: false', async () => {
    const buf = await createPng(100, 100);
    const result = await maybeResize(buf, 'image/png');
    expect(result.resized).toBe(false);
  });

  it('1200x629 は resized: false（高さが閾値以内）', async () => {
    const buf = await createPng(1200, 629);
    const result = await maybeResize(buf, 'image/png');
    expect(result.resized).toBe(false);
  });
});

describe('maybeResize — リサイズ実行（閾値超過）', () => {
  it('1201x630 超の幅は resized: true', async () => {
    const buf = await createPng(1201, 630);
    const result = await maybeResize(buf, 'image/png');
    expect(result.resized).toBe(true);
  });

  it('1200x631 超の高さは resized: true', async () => {
    const buf = await createPng(1200, 631);
    const result = await maybeResize(buf, 'image/png');
    expect(result.resized).toBe(true);
  });

  it('リサイズ後のサイズが MAX_DIMENSION x RESIZE_HEIGHT 以内に収まる', async () => {
    const buf = await createPng(2400, 1260);
    const result = await maybeResize(buf, 'image/png');
    expect(result.resized).toBe(true);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width!).toBeLessThanOrEqual(MAX_DIMENSION);
    expect(meta.height!).toBeLessThanOrEqual(RESIZE_HEIGHT);
  });

  it('アスペクト比を保ちつつリサイズ（横長画像）', async () => {
    // 2400x900 → fit inside 1200x630 なら width=1200, height=450
    const buf = await createPng(2400, 900);
    const result = await maybeResize(buf, 'image/png');
    expect(result.resized).toBe(true);
    const meta = await sharp(result.buffer).metadata();
    // アスペクト比 2400:900 = 8:3 → 幅1200に合わせると高さ450
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(450);
  });

  it('WebP も PNG と同様にリサイズされる', async () => {
    const buf = await sharp({
      create: { width: 1500, height: 700, channels: 3, background: { r: 0, g: 0, b: 0 } },
    }).webp().toBuffer();
    const result = await maybeResize(buf, 'image/webp');
    expect(result.resized).toBe(true);
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width!).toBeLessThanOrEqual(MAX_DIMENSION);
    expect(meta.height!).toBeLessThanOrEqual(RESIZE_HEIGHT);
  });
});

describe('maybeResize — sharp 失敗時フォールバック', () => {
  it('不正バッファは元 buffer を返し resized: false', async () => {
    const buf = Buffer.from('not an image');
    const result = await maybeResize(buf, 'image/png');
    expect(result.resized).toBe(false);
    expect(result.buffer).toBe(buf);
  });
});
