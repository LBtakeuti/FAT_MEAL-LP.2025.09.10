import TurndownService from 'turndown';
import { marked } from 'marked';

let _turndown: TurndownService | null = null;
function getTurndown(): TurndownService {
  if (_turndown) return _turndown;
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
  });
  td.keep(['table', 'thead', 'tbody', 'tr', 'th', 'td']);
  _turndown = td;
  return td;
}

/**
 * F16: TipTap が出力した HTML を Markdown 文字列に変換する。
 * articles.content は Markdown で保存される（公開側 ArticleContent.tsx が react-markdown で描画）。
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return getTurndown().turndown(html).trim();
}

/**
 * F16: DB に保存された Markdown を TipTap 初期値（HTML）に戻す。
 * 編集画面のロード時にのみ使用。
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  // marked.parse は string | Promise<string>。同期版に絞る
  return marked.parse(markdown, { async: false }) as string;
}
