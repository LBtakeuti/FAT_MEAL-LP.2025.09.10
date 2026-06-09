import { describe, it, expect } from 'vitest';
import { isSafeRedirect, sanitizeRedirect } from '../safe-redirect';

describe('isSafeRedirect', () => {
  describe('安全と判定（true）', () => {
    it.each([
      ['/'],
      ['/purchase'],
      ['/admin'],
      ['/login?foo=bar'],
      ['/auth/reset-password'],
      ['/purchase?restore=1'],
      ['/admin/orders?from=2026-06-01&to=2026-06-30'],
    ])('"%s" は安全', (path) => {
      expect(isSafeRedirect(path)).toBe(true);
    });
  });

  describe('絶対URL（false）', () => {
    it.each([
      ['http://evil.com'],
      ['https://evil.com'],
      ['https://evil.example.com/path'],
      ['HTTP://EVIL.COM'],
      ['javascript:alert(1)'],
      ['JAVASCRIPT:alert(1)'],
      ['data:text/html,<script>alert(1)</script>'],
      ['vbscript:msgbox(1)'],
      ['ftp://server'],
      ['file:///etc/passwd'],
      ['mailto:a@b.c'],
    ])('"%s" は安全でない', (url) => {
      expect(isSafeRedirect(url)).toBe(false);
    });
  });

  describe('protocol-relative URL（false）', () => {
    it.each([
      ['//evil.com'],
      ['//evil.com/path'],
      ['///evil.com'],
      ['////evil.com'],
    ])('"%s" は安全でない', (url) => {
      expect(isSafeRedirect(url)).toBe(false);
    });
  });

  describe('F45-fix: バックスラッシュバイパス対策（false）', () => {
    // WHATWG URL パーサーは "\\" を "/" に正規化するため、
    // "/\\evil.com" は new URL で "https://evil.com/" として解釈される。
    // バックスラッシュを含む値は一律拒否する。
    it.each([
      ['/\\evil.com'],
      ['/\\\\evil.com'],
      ['\\/evil.com'],
      ['\\\\evil.com'],
      ['\\\\//evil.com'],
      ['/path/\\evil.com'],
      ['/legit?next=\\evil.com'],
    ])('"%s" は安全でない', (val) => {
      expect(isSafeRedirect(val)).toBe(false);
    });
  });

  describe('相対パス・空値（false）', () => {
    it.each([
      ['relative-path'],
      ['purchase'],
      [''],
      [' '],
      ['./local'],
      ['../parent'],
    ])('"%s" は安全でない', (val) => {
      expect(isSafeRedirect(val)).toBe(false);
    });

    it('null は安全でない', () => {
      expect(isSafeRedirect(null)).toBe(false);
    });

    it('undefined は安全でない', () => {
      expect(isSafeRedirect(undefined)).toBe(false);
    });
  });
});

describe('sanitizeRedirect', () => {
  it('安全な値はそのまま返す', () => {
    expect(sanitizeRedirect('/purchase')).toBe('/purchase');
    expect(sanitizeRedirect('/admin?from=2026-06-01')).toBe('/admin?from=2026-06-01');
  });

  it('不正値はデフォルトフォールバック "/" を返す', () => {
    expect(sanitizeRedirect('https://evil.com')).toBe('/');
    expect(sanitizeRedirect('//evil.com')).toBe('/');
    expect(sanitizeRedirect('javascript:alert(1)')).toBe('/');
    expect(sanitizeRedirect(null)).toBe('/');
    expect(sanitizeRedirect(undefined)).toBe('/');
    expect(sanitizeRedirect('')).toBe('/');
  });

  it('カスタムフォールバックを尊重する', () => {
    expect(sanitizeRedirect('https://evil.com', '/login')).toBe('/login');
    expect(sanitizeRedirect(null, '/mypage')).toBe('/mypage');
  });

  it('カスタムフォールバック自体は検証しない（呼び出し側責任）', () => {
    // sanitize はあくまで「value が安全か」のみ判定。
    // フォールバックは呼び出し側で固定文字列を渡す前提。
    expect(sanitizeRedirect('https://evil.com', '/login?return=' + encodeURIComponent('/'))).toBe(
      '/login?return=' + encodeURIComponent('/')
    );
  });
});
