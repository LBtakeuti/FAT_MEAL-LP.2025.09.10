import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type Stripe from 'stripe';

// モック Stripe クライアント生成ヘルパー
function makeStripeMock(prices: { id: string; metadata: Record<string, string> }[]) {
  return {
    prices: {
      list: vi.fn().mockResolvedValue({ data: prices }),
    },
  } as unknown as Stripe;
}

describe('getPriceIdByInternalCode', () => {
  // 各テスト前にキャッシュをクリアし、モジュールをリセット
  beforeEach(async () => {
    vi.resetModules();
    const m = await import('../stripe-prices');
    m._clearStripePriceCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // 1. metadata 検索ヒット
  it('metadata に internal_code が一致する price を返す', async () => {
    const { getPriceIdByInternalCode, _clearStripePriceCache } = await import('../stripe-prices');
    _clearStripePriceCache();

    const client = makeStripeMock([
      { id: 'price_X', metadata: { internal_code: 'sub-6' } },
      { id: 'price_Y', metadata: { internal_code: 'sub-12' } },
    ]);

    const result = await getPriceIdByInternalCode('sub-6', client);
    expect(result).toBe('price_X');
  });

  // 2. キャッシュ動作: 2回目の呼び出しで Stripe API は呼ばれない
  it('2回目の呼び出しでは Stripe API が呼ばれない', async () => {
    const { getPriceIdByInternalCode, _clearStripePriceCache } = await import('../stripe-prices');
    _clearStripePriceCache();

    const listMock = vi.fn().mockResolvedValue({
      data: [{ id: 'price_cached', metadata: { internal_code: 'sub-6' } }],
    });
    const client = { prices: { list: listMock } } as unknown as Stripe;

    await getPriceIdByInternalCode('sub-6', client);
    await getPriceIdByInternalCode('sub-6', client);

    expect(listMock).toHaveBeenCalledTimes(1);
  });

  // 3. 環境変数 fallback: metadata に該当なし → env fallback を返す
  it('metadata になく env が設定されていれば env fallback を返す', async () => {
    // モジュールをリロードして ENV_FALLBACK に env を反映させる
    vi.stubEnv('STRIPE_PRICE_SUB6_PRODUCT', 'env_price_sub6');
    vi.resetModules();
    const { getPriceIdByInternalCode, _clearStripePriceCache } = await import('../stripe-prices');
    _clearStripePriceCache();

    const client = makeStripeMock([]); // metadata に該当なし
    const result = await getPriceIdByInternalCode('sub-6', client);
    expect(result).toBe('env_price_sub6');
  });

  // 4. Stripe API エラー時の fallback
  it('Stripe API が reject したとき env fallback に落ちる', async () => {
    vi.stubEnv('STRIPE_PRICE_SUB12_PRODUCT', 'env_price_sub12');
    vi.resetModules();
    const { getPriceIdByInternalCode, _clearStripePriceCache } = await import('../stripe-prices');
    _clearStripePriceCache();

    const client = {
      prices: { list: vi.fn().mockRejectedValue(new Error('network error')) },
    } as unknown as Stripe;

    const result = await getPriceIdByInternalCode('sub-12', client);
    expect(result).toBe('env_price_sub12');
  });

  // 5. fallback も無いと throw
  it('metadata なし + env なし → throw する', async () => {
    vi.resetModules();
    const { getPriceIdByInternalCode, _clearStripePriceCache } = await import('../stripe-prices');
    _clearStripePriceCache();

    const client = makeStripeMock([]); // metadata に該当なし
    await expect(getPriceIdByInternalCode('sub-6', client)).rejects.toThrow(
      'Stripe price not found for internal_code="sub-6"',
    );
  });

  // 6. 異なる code でキャッシュ分離
  it('sub-6 と sub-12 は独立してキャッシュされる', async () => {
    const { getPriceIdByInternalCode, _clearStripePriceCache } = await import('../stripe-prices');
    _clearStripePriceCache();

    const client = makeStripeMock([
      { id: 'price_sub6', metadata: { internal_code: 'sub-6' } },
      { id: 'price_sub12', metadata: { internal_code: 'sub-12' } },
    ]);

    const r6 = await getPriceIdByInternalCode('sub-6', client);
    const r12 = await getPriceIdByInternalCode('sub-12', client);

    expect(r6).toBe('price_sub6');
    expect(r12).toBe('price_sub12');
  });

  // 7. キャッシュ TTL 経過後に再取得が起きる
  it('TTL 5分経過後は Stripe API を再度呼ぶ', async () => {
    vi.useFakeTimers();
    const { getPriceIdByInternalCode, _clearStripePriceCache } = await import('../stripe-prices');
    _clearStripePriceCache();

    const listMock = vi.fn().mockResolvedValue({
      data: [{ id: 'price_ttl', metadata: { internal_code: 'sub-6' } }],
    });
    const client = { prices: { list: listMock } } as unknown as Stripe;

    await getPriceIdByInternalCode('sub-6', client);
    // 5分 + 1ms 経過
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);
    await getPriceIdByInternalCode('sub-6', client);

    expect(listMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
