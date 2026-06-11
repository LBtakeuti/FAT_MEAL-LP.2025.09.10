/**
 * F50-2: Markdown 本文から h2 / h3 見出しを抽出して目次（TOC）を作る。
 *
 * - 行頭の "## " / "### " を h2 / h3 として認識する
 * - id は出現順のシリアル番号 (`toc-1`, `toc-2`, ...)
 * - ArticleContent.tsx の h2/h3 レンダラが同じ番号付け規則で id を付与する
 * - 見出し数が 3 未満の記事では TOC を表示しない
 *
 * フェンスコードブロック内の "##" は見出し扱いしないため除外する。
 */

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * F70: 見出しテキストに残る inline markdown 記号を除去して表示用テキストにする。
 * 目次に「*」等の記号が出ないようにする。
 * - リンク [label](url) / 画像 ![alt](url) → label / alt
 * - 強調 **bold** / __bold__ / *italic* / _italic_ → 中身
 * - インラインコード `code` → 中身
 */
export function stripInlineMarkdown(input: string): string {
  let s = input;
  // 画像 ![alt](url) → alt（リンクより先に処理）
  s = s.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  // リンク [label](url) → label
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  // 太字/斜体（** __ * _）。記号のみ外し中身は残す。
  // F70: 語中アンダースコア(user_id 等)を斜体と誤認しないよう、_ 斜体は
  // 前後が行頭/行末/空白のときのみ対象にする（CommonMark の語中 _ 非強調仕様に倣う）。
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/(^|\s)_([^_]+)_(?=\s|$)/g, '$1$2');
  // インラインコード `code` → code
  s = s.replace(/`([^`]+)`/g, '$1');
  return s.trim();
}

export function extractToc(markdown: string): TocItem[] {
  if (!markdown) return [];

  const lines = markdown.split('\n');
  const items: TocItem[] = [];
  let inFence = false;
  let counter = 0;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    // ``` で始まる行はフェンスコードブロックの切り替え
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const h2 = line.match(/^##\s+(.+?)\s*$/);
    const h3 = line.match(/^###\s+(.+?)\s*$/);
    if (h2) {
      counter += 1;
      items.push({ id: `toc-${counter}`, text: stripInlineMarkdown(h2[1].trim()), level: 2 });
      continue;
    }
    if (h3) {
      counter += 1;
      items.push({ id: `toc-${counter}`, text: stripInlineMarkdown(h3[1].trim()), level: 3 });
      continue;
    }
    // それ以外の h1（# ）は TOC 対象外、h4 以降も対象外
  }

  return items;
}
