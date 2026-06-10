import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3010';
const SLUG = 'taberarenai-naze';

test.describe('F50: コラム記事体験強化（シェアボタン / TOC / 関連記事 / スケジュール公開）', () => {
  test('GET /blog/{slug} が 200 で表示される（シェア/TOC/関連記事追加後も既存挙動維持）', async ({ page }) => {
    const res = await page.goto(`${BASE}/blog/${SLUG}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
  });

  test('/blog/{slug} にシェアボタン（X/Twitter）が存在する', async ({ page }) => {
    await page.goto(`${BASE}/blog/${SLUG}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    const twitterLink = await page.$('a[href*="twitter.com"]');
    expect(twitterLink).not.toBeNull();
  });

  test('/blog/{slug} にシェアボタン（LINE）が存在する', async ({ page }) => {
    await page.goto(`${BASE}/blog/${SLUG}`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    const lineLink = await page.$('a[href*="line.me"]');
    expect(lineLink).not.toBeNull();
  });

  test('GET /blog が 200 で表示される（スケジュール公開 WHERE 句追加後も既存記事一覧が表示される）', async ({ page }) => {
    const res = await page.goto(`${BASE}/blog`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    expect(res?.status()).toBe(200);
  });
});

// 手動確認推奨:
// - TOC: 見出し3個以上の記事が存在する場合に [aria-label="もくじ"] が表示されること
//   （現在の実在記事 taberarenai-naze は見出し3個未満のためE2E自動化対象外）
// - 関連記事: 同一タグを持つ複数記事が存在する場合に「こちらの記事もおすすめ」セクションが表示されること
//   （現在の実在記事は関連記事0件のため return null、E2E自動化対象外）
// - スケジュール公開: 未来日時の published_at を設定した記事が一覧・詳細・sitemap に出ないこと
//   （実DBでの動作確認必要）
