import { describe, it, expect } from 'vitest';
import { inheritPreferredDateForBilling } from '../subscription-schedule';

describe('inheritPreferredDateForBilling', () => {
  // --- 月末フォールバックケース ---
  it('1/31 → 4月課金 → 4/30 にフォールバック', () => {
    // 2026-04-01 00:00 UTC = JST 09:00 → 年月は 2026-04
    const billing = new Date('2026-04-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2026-01-31', billing)).toBe('2026-04-30');
  });

  it('3/31 → 4月課金 → 4/30 にフォールバック', () => {
    const billing = new Date('2026-04-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2026-03-31', billing)).toBe('2026-04-30');
  });

  it('5/31 → 6月課金 → 6/30 にフォールバック', () => {
    const billing = new Date('2026-06-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2026-05-31', billing)).toBe('2026-06-30');
  });

  // --- うるう年 ---
  it('1/31 → 2024-02 課金（うるう年）→ 2/29', () => {
    const billing = new Date('2024-02-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2024-01-31', billing)).toBe('2024-02-29');
  });

  it('1/31 → 2025-02 課金（平年）→ 2/28', () => {
    const billing = new Date('2025-02-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2025-01-31', billing)).toBe('2025-02-28');
  });

  // --- 通常ケース（同日継承） ---
  it('6/6 → 7月課金 → 7/6', () => {
    const billing = new Date('2026-07-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2026-06-06', billing)).toBe('2026-07-06');
  });

  it('7/6 → 8月課金 → 8/6', () => {
    const billing = new Date('2026-08-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2026-07-06', billing)).toBe('2026-08-06');
  });

  // --- 既存契約者・形式不正 → null ---
  it('preferred が空文字 → null', () => {
    expect(inheritPreferredDateForBilling('', new Date())).toBeNull();
  });

  it("preferred が 'invalid' → null", () => {
    expect(inheritPreferredDateForBilling('invalid', new Date())).toBeNull();
  });

  it("preferred が '2026-13-01'（月不正・regex は通る）→ null とはならず year/month を信頼する設計のため正常処理", () => {
    // regex /^\d{4}-\d{2}-\d{2}$/ は通過。day=1 は範囲内。
    // month=13 → JS Date は自動繰り越しするため、動作確認のみ（null でない）
    const result = inheritPreferredDateForBilling('2026-13-01', new Date('2026-01-01T00:00:00Z'));
    // day=1, 月の自動繰り越しは起きないが year/month は billingDate から取るので結果は '2026-01-01'
    expect(result).toBe('2026-01-01');
  });

  it("preferred が '2026-02-30'（日不正・regex は通る）→ day=30、2月課金では 28/29 にクランプ", () => {
    // regex は通過、preferredDay=30 は 1-31 の範囲内 → null にならずクランプされる
    const billing = new Date('2026-02-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2026-02-30', billing)).toBe('2026-02-28');
  });

  // --- JST 境界 ---
  it('billingDate が UTC 00:00:00 (= JST 09:00) → JST の日付を正しく使う', () => {
    // 2026-05-01 00:00 UTC = JST 09:00 → JST 年月は 2026-05
    const billing = new Date('2026-05-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2026-04-15', billing)).toBe('2026-05-15');
  });

  it('billingDate が UTC 15:00 (= JST 翌日 00:00) → 翌日の年月を使う', () => {
    // 2026-04-30 15:00 UTC = JST 2026-05-01 00:00 → JST 年月は 2026-05
    const billing = new Date('2026-04-30T15:00:00Z');
    expect(inheritPreferredDateForBilling('2026-04-15', billing)).toBe('2026-05-15');
  });

  it('billingDate が UTC 14:59 (= JST 4/30 23:59) → 課金日(4/30)以降の希望15日は翌月 5/15', () => {
    // 2026-04-30 14:59 UTC = JST 2026-04-30 23:59 → JST 課金日は 4/30
    // 希望15日は当月(4/15)だと課金日より前=過去日になるため翌月 5/15 へ（過去日バグ修正）
    const billing = new Date('2026-04-30T14:59:00Z');
    expect(inheritPreferredDateForBilling('2026-03-15', billing)).toBe('2026-05-15');
  });

  // --- 年またぎ ---
  it('12月課金 → 1/15 の「日」を 12月に継承 → 12/15', () => {
    const billing = new Date('2026-12-01T00:00:00Z');
    expect(inheritPreferredDateForBilling('2026-01-15', billing)).toBe('2026-12-15');
  });

  // --- 定期更新の配送日が過去日になる不具合の修正（課金日以降で最も早い希望日にする） ---
  it('柏崎ケース: 希望2日 / 課金 6/26 → 当月 6/2 は過去日のため翌月 7/2', () => {
    // 2026-06-26 13:23 UTC = JST 6/26 22:23 → 課金日 6/26
    const billing = new Date('2026-06-26T13:23:32Z');
    expect(inheritPreferredDateForBilling('2026-06-02', billing)).toBe('2026-07-02');
  });

  it('宮崎ケース: 希望3日 / 課金 6/27 → 当月 6/3 は過去日のため翌月 7/3', () => {
    // 2026-06-27 11:44 UTC = JST 6/27 20:44 → 課金日 6/27
    const billing = new Date('2026-06-27T11:44:36Z');
    expect(inheritPreferredDateForBilling('2026-06-03', billing)).toBe('2026-07-03');
  });

  it('希望日 == 課金日: 希望26日 / 課金 6/26 → 当月のまま 6/26', () => {
    const billing = new Date('2026-06-26T00:00:00Z'); // = JST 6/26 09:00
    expect(inheritPreferredDateForBilling('2026-06-26', billing)).toBe('2026-06-26');
  });

  it('希望日 > 課金日: 希望20日 / 課金 6/10 → 当月のまま 6/20', () => {
    const billing = new Date('2026-06-10T00:00:00Z'); // = JST 6/10 09:00
    expect(inheritPreferredDateForBilling('2026-06-20', billing)).toBe('2026-06-20');
  });

  // 希望31日 / 課金 6/26: 当月 6月は31日が無く月末クランプで 6/30。
  // 6/30 は課金日 6/26 以降（過去日ではない）ため、月末クランプ既存挙動を維持して当月 6/30 とする。
  // ※ 指示書の表は 7/31 と記載があるが、その値にするには「月末希望日を持つ顧客が 6/30 課金時に
  //   7/31（約1か月後）へ飛ぶ」副作用が生じ実害があるため、仕様本文（月末クランプ維持・
  //   過去日のときだけ翌月送り）に沿って 6/30 とした。要判断のためリードへエスカレーション。
  it('希望31日 / 課金 6/26 → 当月は月末クランプで 6/30（過去日ではないため翌月送りしない）', () => {
    const billing = new Date('2026-06-26T00:00:00Z'); // = JST 6/26 09:00
    expect(inheritPreferredDateForBilling('2026-01-31', billing)).toBe('2026-06-30');
  });
});
