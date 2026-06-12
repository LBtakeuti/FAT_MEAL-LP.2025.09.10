import { test, expect } from '@playwright/test';

// SC-SEO-S1: FAQ の SSR 化 + FAQPage 構造化データ（JSON-LD）の SEO 回帰ガード
// 対象: トップページ（/）の SSR/初期HTML
// 趣旨: SEO-S1 で FAQ をサーバーで await→SSR し、FAQPage JSON-LD を出力する。
//   - no-JS/クローラーで FAQ の Q&A 本文が初期HTMLに出ること（FAQ SSR化）。
//   - FAQPage JSON-LD が妥当（@type=FAQPage / mainEntity[] / 各 Question に name と
//     acceptedAnswer(@type=Answer, text) が揃う）こと＝リッチリザルト要件。
// JS を実行しない生 HTML（request.get）で検証＝クローラー視点と一致・軽量。
// FAQ 本文は本番データ依存のため、特定文言の固定アサートは避け「構造」と
// 「JSON-LD の質問文が本文HTMLにも存在する（=SSR可視）」整合で判定する。

test.describe('SEO-S1 FAQ SSR + FAQPage JSON-LD（SEO回帰ガード）', () => {
  test('トップ / の SSR HTML に妥当な FAQPage JSON-LD があり、Q&A本文がno-JSで可視', async ({
    request,
  }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    const html = await res.text();

    // application/ld+json スクリプトを全て抽出し、FAQPage を探す。
    const scripts = [
      ...html.matchAll(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
      ),
    ].map((m) => m[1]);

    let faqPage: any = null;
    for (const s of scripts) {
      try {
        const obj = JSON.parse(s);
        if (obj && obj['@type'] === 'FAQPage') {
          faqPage = obj;
          break;
        }
      } catch {
        // JSON でないものは無視
      }
    }

    // FAQPage JSON-LD が存在し妥当な構造であること。
    expect(faqPage, 'FAQPage JSON-LD が SSR HTML に存在すること').not.toBeNull();
    expect(faqPage['@context']).toBe('https://schema.org');
    expect(Array.isArray(faqPage.mainEntity)).toBe(true);
    expect(
      faqPage.mainEntity.length,
      'mainEntity（Question 配列）が1件以上あること'
    ).toBeGreaterThan(0);

    // 各 Question が Question/name/acceptedAnswer(Answer, text) を満たすこと。
    for (const q of faqPage.mainEntity) {
      expect(q['@type']).toBe('Question');
      expect(typeof q.name).toBe('string');
      expect(q.name.length).toBeGreaterThan(0);
      expect(q.acceptedAnswer?.['@type']).toBe('Answer');
      expect(typeof q.acceptedAnswer?.text).toBe('string');
      expect(q.acceptedAnswer.text.length).toBeGreaterThan(0);
    }

    // FAQ SSR化の確認: 先頭 Question の質問文が、JSON-LD だけでなく
    // 描画本文の HTML にも存在する（no-JS/クローラーで Q&A が見える）。
    const firstQuestion: string = faqPage.mainEntity[0].name;
    // JSON-LD 内の出現を除いても本文側に出ているか（2回以上＝LD+本文）で担保。
    const occurrences = html.split(firstQuestion).length - 1;
    expect(
      occurrences,
      `先頭FAQ質問文がSSR本文HTMLにも出ること（JSON-LDのみでなくFAQ本体がSSRされている）。質問="${firstQuestion}" 出現数=${occurrences}`
    ).toBeGreaterThanOrEqual(2);
  });
});
