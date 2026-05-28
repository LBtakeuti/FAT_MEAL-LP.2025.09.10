import { describe, it, expect } from 'vitest';

// F16: ArticleForm.tsx の slugify と POST route の slug バリデーション正規表現

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/;

describe('slugify（ArticleForm.tsx）', () => {
  it('半角スペースをハイフンに変換', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('大文字を小文字に変換', () => {
    expect(slugify('MyArticle')).toBe('myarticle');
  });

  it('先頭・末尾のハイフンを除去', () => {
    expect(slugify('-foo-')).toBe('foo');
  });

  it('連続ハイフンを1つに正規化', () => {
    expect(slugify('a--b---c')).toBe('a-b-c');
  });

  it('記号を除去（ひらがな・漢字も除去）', () => {
    const result = slugify('記事タイトル test');
    expect(result).toBe('test');
  });

  it('101文字以上は100文字にスライス', () => {
    const input = 'a'.repeat(110);
    expect(slugify(input).length).toBe(100);
  });

  it('空文字を渡すと空文字を返す', () => {
    expect(slugify('')).toBe('');
  });

  it('数字のみも有効', () => {
    expect(slugify('2026')).toBe('2026');
  });
});

describe('slug バリデーション正規表現（POST route）', () => {
  it('有効: 小文字英数字のみ', () => {
    expect(SLUG_REGEX.test('myarticle')).toBe(true);
  });

  it('有効: ハイフン含む', () => {
    expect(SLUG_REGEX.test('my-article-2026')).toBe(true);
  });

  it('有効: 1文字（英字）', () => {
    expect(SLUG_REGEX.test('a')).toBe(true);
  });

  it('有効: 1文字（数字）', () => {
    expect(SLUG_REGEX.test('1')).toBe(true);
  });

  it('有効: ちょうど100文字', () => {
    const slug = 'a' + 'b'.repeat(98) + 'c';
    expect(slug.length).toBe(100);
    expect(SLUG_REGEX.test(slug)).toBe(true);
  });

  it('無効: 先頭がハイフン', () => {
    expect(SLUG_REGEX.test('-foo')).toBe(false);
  });

  it('無効: 末尾がハイフン', () => {
    expect(SLUG_REGEX.test('foo-')).toBe(false);
  });

  it('無効: 大文字含む', () => {
    expect(SLUG_REGEX.test('MySlug')).toBe(false);
  });

  it('無効: 空文字', () => {
    expect(SLUG_REGEX.test('')).toBe(false);
  });

  it('無効: 101文字以上', () => {
    const slug = 'a' + 'b'.repeat(99) + 'c';
    expect(slug.length).toBe(101);
    expect(SLUG_REGEX.test(slug)).toBe(false);
  });

  it('無効: アンダースコア含む', () => {
    expect(SLUG_REGEX.test('my_slug')).toBe(false);
  });

  it('無効: 日本語含む', () => {
    expect(SLUG_REGEX.test('記事')).toBe(false);
  });
});
