import { describe, it, expect } from 'vitest';
import {
  isExcludedEmail,
  excludedEmailsAsCsv,
  EXCLUDED_DASHBOARD_EMAILS,
} from '../dashboard/excluded-emails';

// F26: excluded-emails.ts のユニットテスト

describe('isExcludedEmail', () => {
  it('除外対象メールは true を返す', () => {
    for (const email of EXCLUDED_DASHBOARD_EMAILS) {
      expect(isExcludedEmail(email)).toBe(true);
    }
  });

  it('除外対象外メールは false を返す', () => {
    expect(isExcludedEmail('customer@example.com')).toBe(false);
    expect(isExcludedEmail('user@gmail.com')).toBe(false);
  });

  it('大文字でも除外判定される（toLowerCase 正規化）', () => {
    expect(isExcludedEmail('TAKEUCHI@LANDBRIDGE.CO.JP')).toBe(true);
    expect(isExcludedEmail('Sales@Landbridge.co.jp')).toBe(true);
  });

  it('null は false を返す', () => {
    expect(isExcludedEmail(null)).toBe(false);
  });

  it('undefined は false を返す', () => {
    expect(isExcludedEmail(undefined)).toBe(false);
  });

  it('空文字は false を返す', () => {
    expect(isExcludedEmail('')).toBe(false);
  });
});

describe('excludedEmailsAsCsv', () => {
  it('括弧付きカンマ区切り CSV を返す', () => {
    const result = excludedEmailsAsCsv();
    expect(result.startsWith('(')).toBe(true);
    expect(result.endsWith(')')).toBe(true);
  });

  it('すべての除外メールを含む', () => {
    const result = excludedEmailsAsCsv();
    for (const email of EXCLUDED_DASHBOARD_EMAILS) {
      expect(result).toContain(email);
    }
  });

  it('フォーマット例: (a@x.com,b@x.com) の形式', () => {
    const result = excludedEmailsAsCsv();
    expect(result).toMatch(/^\(.+\)$/);
    expect(result).not.toContain(' ');
  });
});
