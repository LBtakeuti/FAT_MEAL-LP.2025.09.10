import { describe, it, expect } from 'vitest';
import { getPlanDisplayName } from '../plan-labels';

describe('getPlanDisplayName', () => {
  // --- 現役プラン ---
  it("'trial-6' → 'ふとるめし お試し6食セット'", () => {
    expect(getPlanDisplayName('trial-6')).toBe('ふとるめし お試し6食セット');
  });

  it("'sub-6' → '【定期】ふとるめし6食'", () => {
    expect(getPlanDisplayName('sub-6')).toBe('【定期】ふとるめし6食');
  });

  it("'sub-12' → '【定期】ふとるめし12食'", () => {
    expect(getPlanDisplayName('sub-12')).toBe('【定期】ふとるめし12食');
  });

  // --- 旧プラン ---
  it("'subscription-monthly-12' → '【定期】ふとるめし12食'", () => {
    expect(getPlanDisplayName('subscription-monthly-12')).toBe('【定期】ふとるめし12食');
  });

  it("'subscription-monthly-6' → '【定期】ふとるめし6食'", () => {
    expect(getPlanDisplayName('subscription-monthly-6')).toBe('【定期】ふとるめし6食');
  });

  it("'monthly-12' → '【定期】ふとるめし12食'", () => {
    expect(getPlanDisplayName('monthly-12')).toBe('【定期】ふとるめし12食');
  });

  it("'plan-6' → '【定期】ふとるめし6食'", () => {
    expect(getPlanDisplayName('plan-6')).toBe('【定期】ふとるめし6食');
  });

  it("'plan-12' → '【定期】ふとるめし12食'", () => {
    expect(getPlanDisplayName('plan-12')).toBe('【定期】ふとるめし12食');
  });

  it("'plan-18' → '【定期】ふとるめし18食'", () => {
    expect(getPlanDisplayName('plan-18')).toBe('【定期】ふとるめし18食');
  });

  // --- 未知 planId ---
  it("未知の planId → デフォルト fallback 'ふとるめしプラン'", () => {
    expect(getPlanDisplayName('unknown')).toBe('ふとるめしプラン');
  });

  it("未知の planId + 明示 fallback → 明示 fallback を返す", () => {
    expect(getPlanDisplayName('unknown', 'custom')).toBe('custom');
  });

  // --- null / undefined / 空文字 ---
  it('null → デフォルト fallback', () => {
    expect(getPlanDisplayName(null)).toBe('ふとるめしプラン');
  });

  it('undefined → デフォルト fallback', () => {
    expect(getPlanDisplayName(undefined)).toBe('ふとるめしプラン');
  });

  it("空文字 '' → デフォルト fallback", () => {
    expect(getPlanDisplayName('')).toBe('ふとるめしプラン');
  });

  it('null + 明示 fallback → 明示 fallback を返す', () => {
    expect(getPlanDisplayName(null, 'カスタム')).toBe('カスタム');
  });
});
