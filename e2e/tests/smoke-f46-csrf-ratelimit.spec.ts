import { test, expect } from '@playwright/test';

// SC-F46: CSRF チェック厳格化スモークテスト
// Origin なし（ブラウザコンテキスト外の request API）で各エンドポイントが 403 を返すことを確認
// レートリミット閾値突破確認は実環境推奨のため対象外

test.describe('F46 CSRF チェック（Origin なし → 403）スモークテスト', () => {
  test('POST /api/contact/submit が Origin なしで 403 を返す', async ({ request }) => {
    const res = await request.post('http://localhost:3010/api/contact/submit', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  test('POST /api/payment/create-intent が Origin なしで 403 を返す', async ({ request }) => {
    const res = await request.post('http://localhost:3010/api/payment/create-intent', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(403);
  });

  test('PATCH /api/users/profile が Origin なしで 403 を返す（CSRF が認証より先に効く）', async ({ request }) => {
    const res = await request.patch('http://localhost:3010/api/users/profile', {
      headers: { 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(403);
  });
});
