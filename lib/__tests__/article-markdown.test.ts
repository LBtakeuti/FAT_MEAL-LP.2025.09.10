import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, markdownToHtml } from '../article-markdown';

// F16: article-markdown.ts の往復変換テスト

describe('htmlToMarkdown', () => {
  it('空文字を渡すと空文字を返す', () => {
    expect(htmlToMarkdown('')).toBe('');
  });

  it('h2 を ## に変換', () => {
    expect(htmlToMarkdown('<h2>タイトル</h2>')).toBe('## タイトル');
  });

  it('h3 を ### に変換', () => {
    expect(htmlToMarkdown('<h3>見出し</h3>')).toBe('### 見出し');
  });

  it('ul/li をハイフンリストに変換', () => {
    const result = htmlToMarkdown('<ul><li>A</li><li>B</li></ul>');
    // TurndownService は `-   item` 形式（ハイフン+スペース3つ）で出力する
    expect(result).toMatch(/-\s+A/);
    expect(result).toMatch(/-\s+B/);
  });

  it('blockquote を > に変換', () => {
    const result = htmlToMarkdown('<blockquote><p>引用</p></blockquote>');
    expect(result).toContain('> 引用');
  });

  it('インラインコード（code）を ` ` に変換', () => {
    const result = htmlToMarkdown('<p><code>console.log()</code></p>');
    expect(result).toContain('`console.log()`');
  });

  it('a タグをMarkdownリンクに変換', () => {
    const result = htmlToMarkdown('<a href="https://example.com">Example</a>');
    expect(result).toContain('[Example](https://example.com)');
  });

  it('img タグを Markdown 画像記法に変換', () => {
    const result = htmlToMarkdown('<img src="/img/test.jpg" alt="テスト画像">');
    expect(result).toContain('![テスト画像](/img/test.jpg)');
  });
});

describe('markdownToHtml', () => {
  it('空文字を渡すと空文字を返す', () => {
    expect(markdownToHtml('')).toBe('');
  });

  it('## 見出しを <h2> に変換', () => {
    const result = markdownToHtml('## タイトル');
    expect(result).toContain('<h2>');
    expect(result).toContain('タイトル');
  });

  it('ハイフンリストを <ul><li> に変換', () => {
    const result = markdownToHtml('- A\n- B');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>A</li>');
    expect(result).toContain('<li>B</li>');
  });

  it('インラインコードを <code> に変換', () => {
    const result = markdownToHtml('`console.log()`');
    expect(result).toContain('<code>');
  });

  it('[text](url) をアンカーに変換', () => {
    const result = markdownToHtml('[Example](https://example.com)');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('>Example<');
  });
});

describe('htmlToMarkdown → markdownToHtml 往復変換', () => {
  it('h2 が往復後も同じ見出しテキストを保持', () => {
    const html = '<h2>往復テスト</h2>';
    const md = htmlToMarkdown(html);
    const back = markdownToHtml(md);
    expect(back).toContain('<h2>');
    expect(back).toContain('往復テスト');
  });

  it('リストが往復後も各項目テキストを保持', () => {
    const html = '<ul><li>項目1</li><li>項目2</li></ul>';
    const md = htmlToMarkdown(html);
    const back = markdownToHtml(md);
    expect(back).toContain('項目1');
    expect(back).toContain('項目2');
  });

  it('リンクが往復後も href とテキストを保持', () => {
    const html = '<a href="https://example.com">リンク</a>';
    const md = htmlToMarkdown(html);
    const back = markdownToHtml(md);
    expect(back).toContain('https://example.com');
    expect(back).toContain('リンク');
  });
});
