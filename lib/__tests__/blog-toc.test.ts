import { describe, it, expect } from 'vitest';
import { extractToc, stripInlineMarkdown } from '../blog-toc';

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

// F70: 見出しテキストに残る inline markdown 記号を除去して表示用テキストにする。
describe('stripInlineMarkdown', () => {
  it('太字 **bold** → 中身', () => {
    expect(stripInlineMarkdown('**太字**')).toBe('太字');
  });

  it('斜体 *italic* → 中身', () => {
    expect(stripInlineMarkdown('*斜体*')).toBe('斜体');
  });

  it('太字 __bold__（アンダースコア2つ）→ 中身', () => {
    expect(stripInlineMarkdown('__太字__')).toBe('太字');
  });

  it('斜体 _italic_（アンダースコア1つ）→ 中身', () => {
    expect(stripInlineMarkdown('_斜体_')).toBe('斜体');
  });

  it('インラインコード `code` → 中身', () => {
    expect(stripInlineMarkdown('`code`')).toBe('code');
  });

  it('リンク [label](url) → label', () => {
    expect(stripInlineMarkdown('[公式サイト](https://example.com)')).toBe('公式サイト');
  });

  it('画像 ![alt](url) → alt', () => {
    expect(stripInlineMarkdown('![代替テキスト](/images/a.png)')).toBe('代替テキスト');
  });

  it('複数記号の混在を一括除去する', () => {
    expect(
      stripInlineMarkdown('**重要** な `処理` と [リンク](https://x.test) と *補足*'),
    ).toBe('重要 な 処理 と リンク と 補足');
  });

  it('画像とリンクが混在しても画像優先で正しく処理する', () => {
    expect(stripInlineMarkdown('![図](/a.png) と [文書](/b)')).toBe('図 と 文書');
  });

  it('記号を含まない平文は変化しない', () => {
    expect(stripInlineMarkdown('ふとるめしのある毎日')).toBe('ふとるめしのある毎日');
  });

  it('前後の空白は trim される', () => {
    expect(stripInlineMarkdown('  **太字**  ')).toBe('太字');
  });

  // F70 follow-up (30b10f9): 語中アンダースコアを斜体と誤認して過剰除去しない。
  it('語中アンダースコア(user_id)は斜体扱いせず保持する', () => {
    expect(stripInlineMarkdown('user_id の取り扱い')).toBe('user_id の取り扱い');
  });

  it('複数の語中アンダースコア(api_key, access_token)も保持する', () => {
    expect(stripInlineMarkdown('api_key と access_token')).toBe('api_key と access_token');
  });

  it('空白で区切られた _斜体_ は従来どおり中身を残して記号除去する', () => {
    expect(stripInlineMarkdown('これは _斜体_ です')).toBe('これは 斜体 です');
  });

  it('語中アンダースコアと正当な _斜体_ が混在しても斜体のみ除去する', () => {
    expect(stripInlineMarkdown('user_id は _重要_ です')).toBe('user_id は 重要 です');
  });
});

describe('extractToc × stripInlineMarkdown 連携', () => {
  it('見出し内の inline markdown 記号は text から除去され、toc-N id は従来どおり付与される', () => {
    const md = `## **重要**ポイント\n\n本文\n\n### \`コード\`の使い方\n\n## [参考](https://x.test)リンク集\n`;
    const toc = extractToc(md);
    expect(toc).toEqual([
      { id: 'toc-1', text: '重要ポイント', level: 2 },
      { id: 'toc-2', text: 'コードの使い方', level: 3 },
      { id: 'toc-3', text: '参考リンク集', level: 2 },
    ]);
  });
});
