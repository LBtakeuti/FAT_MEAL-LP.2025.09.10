import { describe, it, expect } from 'vitest';
import { extractToc } from '../blog-toc';

describe('extractToc', () => {
  it('空文字列は空配列を返す', () => {
    expect(extractToc('')).toEqual([]);
  });

  it('h2 と h3 を出現順にシリアル番号付きで抽出する', () => {
    const md = `## はじめに\n\n本文\n\n### 背景\n\n本文\n\n## 結論\n`;
    const toc = extractToc(md);
    expect(toc).toEqual([
      { id: 'toc-1', text: 'はじめに', level: 2 },
      { id: 'toc-2', text: '背景', level: 3 },
      { id: 'toc-3', text: '結論', level: 2 },
    ]);
  });

  it('h1 と h4 は TOC 対象外', () => {
    const md = `# タイトル\n\n## 見出し2\n\n#### h4見出し\n\n## 別の見出し2\n`;
    const toc = extractToc(md);
    expect(toc).toEqual([
      { id: 'toc-1', text: '見出し2', level: 2 },
      { id: 'toc-2', text: '別の見出し2', level: 2 },
    ]);
  });

  it('フェンスコードブロック内の "##" は見出しとして抽出しない', () => {
    const md = '## 実装\n\n```\n## これはコード\n### こちらも\n```\n\n## 結果\n';
    const toc = extractToc(md);
    expect(toc).toEqual([
      { id: 'toc-1', text: '実装', level: 2 },
      { id: 'toc-2', text: '結果', level: 2 },
    ]);
  });

  it('末尾の空白は除去される', () => {
    const md = '##   タイトル末尾余白   \n';
    const toc = extractToc(md);
    expect(toc).toEqual([{ id: 'toc-1', text: 'タイトル末尾余白', level: 2 }]);
  });

  it('CRLF 改行も認識する', () => {
    const md = '## a\r\n\r\n## b\r\n';
    const toc = extractToc(md);
    expect(toc.map((t) => t.text)).toEqual(['a', 'b']);
  });
});
